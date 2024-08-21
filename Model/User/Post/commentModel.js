const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    reply: [
      {
        content: { type: String },
        tagedUser: [{ type: Types.ObjectId, ref: "User" }],
        user: {
          type: Types.ObjectId,
          ref: "User",
          required: true,
        },
        isDelete: {
          type: Boolean,
          default: false,
        },
        createdAt_at: {
          type: Date,
        },
      },
    ],
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
