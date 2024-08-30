const { Schema, model, models } = require("mongoose");

// Define the schema
const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    categoryPic: {
      fileName: { type: String },
      url: { type: String },
    },
    sort_order: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Create the model using the schema

exports.ParentBlogCategories =
  models.ParentBlogCategories || model("ParentBlogCategories", schema);
