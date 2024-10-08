const { Schema, model, models } = require("mongoose");

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    firmPic: {
      fileName: { type: String },
      url: { type: String },
    },
  },
  { timestamps: true }
);

exports.FirmCompany = models.FirmCompany || model("FirmCompany", schema);
