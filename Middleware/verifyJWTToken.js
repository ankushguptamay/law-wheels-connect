const jwt = require("jsonwebtoken");
const { ErrorHandler } = require("../Util/utility");
const { Admin } = require("../Model/Admin/adminModel");
const { User } = require("../Model/User/userModel");
const { Bloger } = require("../Model/Blog/blogerModel");
const { JWT_SECRET_KEY_ADMIN, JWT_SECRET_KEY_USER, JWT_SECRET_KEY_BLOGER } =
  process.env;

exports.verifyUserJWT = async (req, res, next) => {
  try {
    const token = req.cookies["link-user-token"];

    if (!token) return res.sendStatus(401);

    const decode = jwt.verify(token, JWT_SECRET_KEY_USER);

    const user = await User.findOne({ _id: decode._id });
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
    const token = req.cookies["link-admin-token"];

    if (!token) return res.sendStatus(401);

    const decode = jwt.verify(token, JWT_SECRET_KEY_ADMIN);

    const admin = await Admin.findOne({ _id: decode._id });
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

exports.verifyBlogerJWT = async (req, res, next) => {
  try {
    const token = req.cookies["link-bloger-token"];

    if (!token) return res.sendStatus(401);

    const decode = jwt.verify(token, JWT_SECRET_KEY_BLOGER);

    const bloger = await Bloger.findOne({ _id: decode._id });
    if (!bloger) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized!",
      });
    }
    req.bloger = decode;
    return next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// exports.socketAuthenticator = async (err, socket, next) => {
//   try {
//     if (err) return next(err);

//     const authToken = socket.request.cookies["chat-user-token"];

//     if (!authToken)
//       return next(new ErrorHandler("Please login to access this route", 401));

//     const decodedData = jwt.verify(authToken, process.env.USER_JWT_SECRET_KEY);

//     const user = await User.findOne({ where: { id: decodedData.id } });

//     if (!user)
//       return next(new ErrorHandler("Please login to access this route", 401));
//     socket.user = user;

//     return next();
//   } catch (error) {
//     console.log(error);
//     return next(new ErrorHandler("Please login to access this route", 401));
//   }
// };
