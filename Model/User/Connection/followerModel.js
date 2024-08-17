const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    follower: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    followee: {
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

exports.Follow = models.Follow || model("Follow", schema);
