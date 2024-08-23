const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    content: { type: String },
    postType: {
      type: String,
      enum: {
        values: [
          "text",
          "media",
          "template",
          "event",
          "celebrate",
          "job",
          "poll",
          "document",
          "services",
        ],
      },
      default: "text",
    },
    hash_tag: { type: [String] },
    media: [
      {
        mimeType: { type: String },
        url: { type: String },
        fileName: { type: String },
      },
    ],
    template: {
      url: { type: String },
      fileName: { type: String },
    },
    document: {
      url: { type: String },
      fileName: { type: String },
    },
    celebrate: {
      person: [{ type: Types.ObjectId, ref: "User" }],
      url: { type: String },
      fileName: { type: String },
    },
    poll: {
      question: { type: String },
      option1: { type: String },
      option2: { type: String },
      option3: { type: String },
      option4: { type: String },
      expireIn: { type: String },
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalReaction: {
      type: Number,
      default: 0,
    },
    totalComment: {
      type: Number,
      default: 0,
    },
    totalRepost: {
      type: Number,
      default: 0,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
    },
  },
  { timestamps: true }
);

exports.Post = models.Post || model("Post", schema);

// event
// Job
// poll
