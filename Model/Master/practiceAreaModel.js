const { Schema, model, models } = require("mongoose");

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

exports.PracticeArea = models.PracticeArea || model("PracticeArea", schema);
