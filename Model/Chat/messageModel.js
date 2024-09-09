const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    content: { type: String },
    attachments: [
      {
        mimeType: { type: String },
        url: { type: String },
        fileName: { type: String },
      },
    ],
    isView: { type: Boolean, default: false },
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    chat: {
      type: Types.ObjectId,
      ref: "Chat",
      required: true,
    },
  },
  { timestamps: true }
);

exports.Message = models.Message || model("Message", schema);
