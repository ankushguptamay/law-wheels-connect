const { Schema, model, models } = require("mongoose");

const schema = new Schema(
  {
    part_number: { type: Number },
    part_number_romanise: { type: String },
    part_title: { type: String },
    chapter_number: { type: String },
    chapter_title: { type: String },
    article_type: { type: String },
    article_order: { type: Number },
    article_number: { type: String },
    article_title: { type: String },
    article_content: { type: String },
    extras: [
      { ponit_number: { type: Number } },
      { point_content: { type: String } },
    ],
  },
  { timestamps: true }
);

exports.Constitution = models.Constitution || model("Constitutions", schema);
