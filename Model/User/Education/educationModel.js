const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    school_university: {
      type: String,
      required: true,
    },
    degreeType: {
      type: String,
    },
    fieldOfStudy: {
      type: String,
    },
    grade: {
      type: String,
    },
    activities: {
      type: String,
    },
    startDate: {
      month: { type: String },
      year: { type: String },
    },
    endDate: {
      month: { type: String },
      year: { type: String },
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    isRecent: {
      type: Boolean,
      default: false,
    },
    isOngoing: {
      type: Boolean,
      default: false,
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

exports.Education = models.Education || model("Education", schema);
