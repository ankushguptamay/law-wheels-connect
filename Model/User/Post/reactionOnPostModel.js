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
    post: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true }
);

exports.ReactionOnPost = models.ReactionOnPost || model("ReactionOnPost", schema);
