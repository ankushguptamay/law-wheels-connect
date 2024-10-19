const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

exports.connectDB = (uri) => {
  mongoose
    .connect(uri, { dbName: process.env.DB_NAME })
    .then((data) => {
      console.log("Database Connected successfully!");
    })
    .catch((err) => {
      throw err;
    });
};

exports.sendToken = (res, user, code, message, tokenName) => {
  let token;
  if (tokenName === "admin") {
    token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY_ADMIN,
      { expiresIn: process.env.JWT_VALIDITY }
    );
  } else if (tokenName === "blogger") {
    token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY_BLOGGER,
      { expiresIn: process.env.JWT_VALIDITY }
    );
  } else {
    token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY_USER,
      { expiresIn: process.env.JWT_VALIDITY }
    );
  }

  return res.status(code).json({
    success: true,
    AccessToken: token,
    user,
    message,
  });
};

exports.getOtherExceptGivenFileName = (all, given) => {
  const newAlls = [];
  for (let i = 0; i < all.length; i++) {
    if (all[i].fileName !== given) {
      newAlls.push(all[i]);
    }
  }
  return newAlls;
};
