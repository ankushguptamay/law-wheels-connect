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
    replies: {
      type: Types.ObjectId,
      ref: "Replies",
      required: true,
    },
  },
  { timestamps: true }
);

exports.ReactionOnReplies = models.ReactionOnReplies || model("ReactionOnReplies", schema);
