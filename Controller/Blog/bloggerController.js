const {
  validateAdminRegistration,
  validateAdminLogin,
} = require("../../Middleware/Validation/adminValidation");
const { Blogger } = require("../../Model/Blog/bloggerModel");
const {
  createAccessToken,
  createRefreshToken,
} = require("../../Util/jwtToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { capitalizeFirstLetter } = require("../../Util/utility");
const SALT = 10;

exports.getBolger = async (req, res) => {
  try {
    const blogger = await Blogger.findOne({ _id: req.blogger._id });
    res.status(200).json({
      success: true,
      message: "Blogger fetched successfully!",
      data: blogger,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.registerBlogger = async (req, res, next) => {
  try {
    // Body Validation
    const { error } = validateAdminRegistration(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, mobileNumber, password } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    const isBlogger = await Blogger.findOne({ email: email });
    if (isBlogger) {
      return res.status(400).json({
        success: false,
        message: "Blogger already present!",
      });
    }

    const salt = await bcrypt.genSalt(SALT);
    const hashedPassword = await bcrypt.hash(password, salt);

    const blogger = await Blogger.create({
      email: email,
      mobileNumber: mobileNumber,
      name: name,
      password: hashedPassword,
    });

    const token = createAccessToken("blogger", email, blogger._id);
    const refreshToken = createRefreshToken("blogger", blogger._id);

    await blogger.updateOne({ refreshToken });

    res.status(201).json({
      success: true,
      AccessToken: token,
      refreshToken,
      user: blogger,
      message: "Blogger created",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.loginBlogger = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateAdminLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    const isBlogger = await Blogger.findOne({ email }).select("+password");
    if (!isBlogger) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password!",
      });
    }

    const validPassword = await bcrypt.compare(password, isBlogger.password);
    if (!validPassword) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password!",
      });
    }

    const token = createAccessToken("blogger", isBlogger.email, isBlogger._id);
    const refreshToken = createRefreshToken("blogger", isBlogger._id);

    await isBlogger.updateOne({ refreshToken });

    res.status(200).json({
      success: true,
      AccessToken: token,
      refreshToken,
      user: isBlogger,
      message: `Welcome Back, ${isBlogger.name}`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res
      .status(401)
      .send({ success: false, message: "Refresh token required!" });

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET_REFRESH_KEY_BLOGGER
    );
    const blogger = await Blogger.findById(decoded._id);

    if (!blogger || blogger?.refreshToken !== refreshToken) {
      return res.status(403).send({ success: false, message: "Unauthorized!" });
    }

    const token = createAccessToken("blogger", blogger.email, blogger._id);

    res.status(200).json({ success: true, AccessToken: token, refreshToken });
  } catch (err) {
    res.status(403).send({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    await Blogger.updateOne(
      { _id: req.blogger._id },
      { refreshToken: undefined }
    );
    res.status(200).json({ success: true, message: "Loged out successfully" });
  } catch (err) {
    res.status(403).send({ success: false, message: err.message });
  }
};
