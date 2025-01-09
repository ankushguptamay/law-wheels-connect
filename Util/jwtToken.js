const jwt = require("jsonwebtoken");

exports.createAccessToken = (tokenFor = "user", email, _id) => {
  let token;
  if (tokenFor === "admin") {
    console.log("HERE")
    token = jwt.sign({ _id, email }, process.env.JWT_SECRET_KEY_ADMIN, {
      expiresIn: process.env.JWT_ACCESS_VALIDITY,
    });
  } else if (tokenFor === "blogger") {
    token = jwt.sign({ _id, email }, process.env.JWT_SECRET_KEY_BLOGGER, {
      expiresIn: process.env.JWT_ACCESS_VALIDITY,
    });
  } else {
    token = jwt.sign({ _id, email }, process.env.JWT_SECRET_KEY_USER, {
      expiresIn: process.env.JWT_ACCESS_VALIDITY,
    });
  }
  return token;
};

exports.createRefreshToken = (tokenFor = "user", _id) => {
  let token;
  if (tokenFor === "admin") {
    token = jwt.sign({ _id }, process.env.JWT_SECRET_KEY_ADMIN, {
      expiresIn: process.env.JWT_REFRESH_VALIDITY,
    });
  } else if (tokenFor === "blogger") {
    token = jwt.sign({ _id }, process.env.JWT_SECRET_REFRESH_KEY_BLOGGER, {
      expiresIn: process.env.JWT_REFRESH_VALIDITY,
    });
  } else {
    token = jwt.sign({ _id }, process.env.JWT_SECRET_REFRESH_KEY_USER, {
      expiresIn: process.env.JWT_REFRESH_VALIDITY,
    });
  }
  return token;
};
