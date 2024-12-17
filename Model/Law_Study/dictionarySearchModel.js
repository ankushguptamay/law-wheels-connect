const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    word: {
      type: Types.ObjectId,
      ref: "Dictionaries",
      required: true,
    },
  },
  { timestamps: true }
);

exports.DictionarySearchs =
  models.DictionarySearchs || model("DictionarySearchs", schema);
