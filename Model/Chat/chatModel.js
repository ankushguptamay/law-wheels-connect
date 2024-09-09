const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    chatName: { type: String },
    groupChat: { type: Boolean, default: false },
    avatar: {
      url: { type: String },
      fileName: { type: String },
    },
    privateConnection: { type: Boolean, default: false },
    members: [{ type: Types.ObjectId, ref: "User" }],
    admins: [{ type: Types.ObjectId, ref: "User" }],
    creator: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

exports.Chat = models.Chat || model("Chat", schema);
