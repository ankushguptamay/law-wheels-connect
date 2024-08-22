const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    like: {
      type: Boolean,
      default: false,
    },
    celebrate: {
      type: Boolean,
      default: false,
    },
    support: {
      type: Boolean,
      default: false,
    },
    love: {
      type: Boolean,
      default: false,
    },
    insightful: {
      type: Boolean,
      default: false,
    },
    funny: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: {
      type: Types.ObjectId,
      ref: "Comment",
      required: true,
    },
  },
  { timestamps: true }
);

exports.ReactionOnComment = models.ReactionOnComment || model("ReactionOnComment", schema);
