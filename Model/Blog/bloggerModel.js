const { Schema, model, models } = require("mongoose");

const schema = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

exports.Blogger = models.Blogger || model("Blogger", schema);
