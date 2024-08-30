const { Schema, model, models, Types } = require("mongoose");

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
    parentBlogCatagories: {
      type: Types.ObjectId,
      ref: "ParentBlogCategories"
    },
    sort_order: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Create the model using the schema

exports.BlogCategories = models.BlogCategories || model("BlogCategories", schema);
