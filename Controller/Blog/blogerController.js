const {
  validateAdminRegistration,
  validateAdminLogin,
} = require("../../Middleware/Validation/adminValidation");
const { Bloger } = require("../../Model/Blog/blogerModel");
const { sendToken, cookieOptions } = require("../../Util/features");
const bcrypt = require("bcryptjs");
const { capitalizeFirstLetter } = require("../../Util/utility");
const SALT = 10;

exports.getBolger = async (req, res) => {
  try {
    const bloger = await Bloger.findOne({ _id: req.bloger._id });
    res.status(200).json({
      success: true,
      message: "Bloger fetched successfully!",
      data: bloger,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.registerBloger = async (req, res, next) => {
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
    const isBloger = await Bloger.findOne({ email: email });
    if (isBloger) {
      return res.status(400).json({
        success: false,
        message: "Bloger already present!",
      });
    }

    const salt = await bcrypt.genSalt(SALT);
    const hashedPassword = await bcrypt.hash(password, salt);

    const bloger = await Bloger.create({
      email: email,
      mobileNumber: mobileNumber,
      name: name,
      password: hashedPassword,
    });
    sendToken(res, bloger, 201, "Bloger created", "link-bloger-token");
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.loginBloger = async (req, res) => {
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

    const isBloger = await Bloger.findOne({ email }).select("+password");
    if (!isBloger) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password!",
      });
    }

    const validPassword = await bcrypt.compare(password, isBloger.password);
    if (!validPassword) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password!",
      });
    }

    sendToken(
      res,
      isBloger,
      200,
      `Welcome Back, ${isBloger.name}`,
      "link-bloger-token"
    );
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.logOut = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("link-bloger-token", "", { ...cookieOptions, maxAge: 0 })
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};
