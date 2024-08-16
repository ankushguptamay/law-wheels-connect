const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    typeOfMedia: {
      type: String,
      enum: {
        values: ["Link", "File"],
        message: "{VALUE} is not supported",
      },
    },
    mimeType: {
      type: String,
    },
    url: {
      type: String,
    },
    fileName: {
      type: String,
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

exports.UserMedia = models.UserMedia || model("UserMedia", schema);
