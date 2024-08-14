const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    certificate_number: {
      type: String,
      required: true,
    },
    firmName: {
      type: String,
    },
    issueDate: {
      type: Date,
    },
    certificate_name: {
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

exports.Certificate = models.Certificate || model("Certificate", schema);
