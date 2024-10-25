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
    isRecent: {
      type: Boolean,
      default: false,
    },
    isOngoing: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
    education: {
      type: Types.ObjectId,
      ref: "Education",
      required: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

exports.EducationUpdationHistory =
  models.EducationUpdationHistory || model("Educationupdationhistory", schema);
