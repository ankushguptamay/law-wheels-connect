const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    profileViewer: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    profileOwner: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

exports.ProfileView = models.ProfileView || model("ProfileView", schema);
