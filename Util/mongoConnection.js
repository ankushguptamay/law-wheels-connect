const mongoose = require("mongoose");

exports.connectDB = (uri) => {
  mongoose
    .connect(uri, { dbName: process.env.DB_NAME })
    .then(async (data) => {
      console.log("Database Connected successfully!");

      // Drop the entire database
      await mongoose.connection.db.dropDatabase();
      console.log("Database dropped");
    })
    .catch((err) => {
      throw err;
    });
};
