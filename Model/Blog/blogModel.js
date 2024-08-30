const { Schema, model, models, Types } = require("mongoose");

// Define the schema
const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: [{ type: Types.ObjectId, ref: "BlogCategories" }],
    tag: [{ type: Types.ObjectId, ref: "BlogTag" }],
    content: {
      type: String,
    },
    excerpt: { type: String },
    featuredPic: {
      fileName: { type: String },
      url: { type: String },
    },
    additionalPic: [
      {
        fileName: { type: String },
        url: { type: String },
      },
    ],
    readTime: { type: String },
    author: {
      type: Types.ObjectId,
      ref: "Blogger",
      required: true,
    },
    publishDate: { type: Date, default: new Date() },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["Draft", "Published"],
      },
      default: "Draft",
    },
  },
  { timestamps: true }
);

// Create the model using the schema

exports.Blog = models.Blog || model("Blog", schema);
