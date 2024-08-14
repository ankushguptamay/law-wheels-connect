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
    certificate: {
      type: Types.ObjectId,
      ref: "Education",
      required: true,
    },
  },
  { timestamps: true }
);

exports.CertificateUpdationHistory =
  models.CertificateUpdationHistory ||
  model("Certificateupdationhistory", schema);
