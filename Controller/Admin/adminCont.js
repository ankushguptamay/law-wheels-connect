const { Admin } = require("../../Model/Admin/adminModel");
const {
  validateAdminRegistration,
  validateAdminLogin,
} = require("../../Middleware/Validation/adminValidation");
const { sendToken } = require("../../Util/features");
const bcrypt = require("bcryptjs");
const { capitalizeFirstLetter } = require("../../Util/utility");
const SALT = 10;

exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ _id: req.admin._id });
    res.status(200).json({
      success: true,
      message: "Admin fetched successfully!",
      data: admin,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.registerAdmin = async (req, res, next) => {
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
    const isAdmin = await Admin.findOne({ email: email });
    if (isAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already present!",
      });
    }

    const salt = await bcrypt.genSalt(SALT);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      email: email,
      mobileNumber: mobileNumber,
      name: name,
      password: hashedPassword,
    });
    sendToken(res, admin, 201, "Admin created", "admin");
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.loginAdmin = async (req, res) => {
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

    const isAdmin = await Admin.findOne({ email }).select("+password");
    if (!isAdmin) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password!",
      });
    }

    const validPassword = await bcrypt.compare(password, isAdmin.password);
    if (!validPassword) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password!",
      });
    }

    sendToken(res, isAdmin, 200, `Welcome Back, ${isAdmin.name}`, "admin");
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
