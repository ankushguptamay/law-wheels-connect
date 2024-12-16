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
  },
  { timestamps: true }
);

exports.Follow = models.Follow || model("Follow", schema);
