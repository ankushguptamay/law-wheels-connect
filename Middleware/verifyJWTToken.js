const jwt = require("jsonwebtoken");
const { ErrorHandler } = require("../Util/utility");
const { Admin } = require("../Model/Admin/adminModel");
const { User } = require("../Model/User/userModel");
const { Blogger } = require("../Model/Blog/bloggerModel");
const { JWT_SECRET_KEY_ADMIN, JWT_SECRET_KEY_USER, JWT_SECRET_KEY_BLOGGER } =
  process.env;

exports.verifyUserJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    // console.log('JWT Verif MW');
    if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    const decode = jwt.verify(token, JWT_SECRET_KEY_USER);

    const user = await User.findOne(
      { _id: decode._id },
      "_id name email mobileNumber isLicenseVerified role isProfileVisible"
    );
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized!",
      });
    }
    req.user = user;
    return next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.verifyAdminJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    // console.log('JWT Verif MW');
    if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    const decode = jwt.verify(token, JWT_SECRET_KEY_ADMIN);

    const admin = await Admin.findOne(
      { _id: decode._id },
      "_id name email mobileNumber isLicenseVerified role"
    );
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized!",
      });
    }
    req.admin = decode;
    return next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.verifyBloggerJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    // console.log('JWT Verif MW');
    if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    const decode = jwt.verify(token, JWT_SECRET_KEY_BLOGGER);

    const blogger = await Blogger.findOne(
      { _id: decode._id },
      "_id name email mobileNumber isLicenseVerified role"
    );
    if (!blogger) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized!",
      });
    }
    req.blogger = decode;
    return next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.socketAuthenticator = async (socket, next) => {
  try {
    // console.log(socket);
    const token =
      socket.handshake.auth.token || socket.handshake.headers["authorization"];

    if (!token)
      return next(new ErrorHandler("Please login to access this route", 401));

    const decodedData = jwt.verify(token, JWT_SECRET_KEY_USER);

    const user = await User.findOne(
      { _id: decodedData._id },
      "_id name email mobileNumber isLicenseVerified role profilePic"
    );

    if (!user)
      return next(new ErrorHandler("Please login to access this route", 401));
    socket.user = user;

    return next();
  } catch (error) {
    return next(new ErrorHandler("Please login to access this route", 401));
  }
};
