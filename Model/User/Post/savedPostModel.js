const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    post: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

exports.SavedPost = models.SavedPost || model("SavedPost", schema);
