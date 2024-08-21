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

exports.cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

exports.sendToken = (res, user, code, message, tokenName) => {
  let token;
  if (tokenName === "link-admin-token") {
    token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY_ADMIN
    );
  } else {
    token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY_USER
    );
  }

  return res.status(code).cookie(tokenName, token, this.cookieOptions).json({
    success: true,
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
