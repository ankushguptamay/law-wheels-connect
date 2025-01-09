const { Schema, model, models } = require("mongoose");

const schema = new Schema(
  {
    word: { type: String },
    definition: { type: String },
  },
  { timestamps: true }
);

exports.Dictionaries = models.Dictionaries || model("Dictionaries", schema);
