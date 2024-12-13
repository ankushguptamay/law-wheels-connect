const mongoose = require("mongoose");

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
