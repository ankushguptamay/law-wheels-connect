const { Schema, model, models } = require("mongoose");

const schema = new Schema(
  {
    name: {
      type: Number,
      required: true,
    },
    image: {
      fileName: { type: String },
      url: { type: String },
    },
  },
  { timestamps: true }
);

exports.SchoolUniversity =
  models.SchoolUniversity || model("SchoolUniversity", schema);
