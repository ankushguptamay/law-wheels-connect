const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    jobTitle: {
      type: String,
    },
    firmName: {
      type: String,
      required: true,
    },
    startDate: {
      month: { type: String },
      year: { type: String },
    },
    endDate: {
      month: { type: String },
      year: { type: String },
    },
    description: {
      type: String,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    experience: {
      type: Types.ObjectId,
      ref: "Experience",
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
  },
  { timestamps: true }
);

exports.ExperienceUpdationHistory =
  models.ExperienceUpdationHistory ||
  model("Experienceupdationhistory", schema);
