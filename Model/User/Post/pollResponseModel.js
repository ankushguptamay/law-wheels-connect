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
    option1: [{ type: Types.ObjectId, ref: "User" }],
    option2: [{ type: Types.ObjectId, ref: "User" }],
    option3: [{ type: Types.ObjectId, ref: "User" }],
    option4: [{ type: Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

exports.PollResponse = models.PollResponse || model("PollResponse", schema);
