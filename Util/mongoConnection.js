const mongoose = require("mongoose");
const { User } = require("../Model/User/userModel");

exports.connectDB = (uri) => {
  mongoose
    .connect(uri, { dbName: process.env.DB_NAME })
    .then(async (data) => {
      console.log("Database Connected successfully!");

      // Drop the entire database
      // await mongoose.connection.db.dropDatabase();
      // console.log("Database dropped");
    })
    .catch((err) => {
      throw err;
    });
};

async function updateExistingUsers() {
  try {
    const result = await User.updateMany(
      { averageRating: { $exists: false } },
      { $set: { averageRating: 0 } }
    );
    console.log(`${result.modifiedCount} documents updated.`);
  } catch (error) {
    console.error("Error updating documents:", error);
  }
}

updateExistingUsers();
