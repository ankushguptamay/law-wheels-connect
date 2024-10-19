const {
  validateAdminRegistration,
  validateAdminLogin,
} = require("../../Middleware/Validation/adminValidation");
const { Blogger } = require("../../Model/Blog/bloggerModel");
const { sendToken } = require("../../Util/features");
const bcrypt = require("bcryptjs");
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
    sendToken(res, blogger, 201, "Blogger created", "blogger");
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

    sendToken(
      res,
      isBlogger,
      200,
      `Welcome Back, ${isBlogger.name}`,
      "blogger"
    );
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
