const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    postViewer: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    postOwner: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true }
);

exports.PostImpression =
  models.PostImpression || model("PostImpression", schema);
