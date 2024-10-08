const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    tagedUser: [{ type: Types.ObjectId, ref: "User" }],
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
    isDelete: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
    },
  },
  { timestamps: true }
);

exports.Comment = models.Comment || model("Comment", schema);
