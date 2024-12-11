const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    user: {
      type: Types.ObjectId,
      ref: "User"
    },
  },
  { timestamps: true }
);

exports.UserDeleteRequestPlayStore =
  models.UserDeleteRequestPlayStore ||
  model("UserDeleteRequestPlayStore", schema);
