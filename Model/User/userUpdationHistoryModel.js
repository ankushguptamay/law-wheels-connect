const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema({
  name: {
    type: String,
  },
  licenseIssueYear: { type: Date },
  isLicenseVerified: {
    type: Boolean,
  },
  profession_nun_user: {
    type: String,
  },
  headLine: {
    type: String, // Using as Bio
  },
  bar_council_license_number: {
    type: String,
  },
  location: {
    country: { type: String },
    state: { type: String },
    city: { type: String },
  },
  profilePic: {
    fileName: { type: String },
    url: { type: String },
  },
  licensePic: {
    fileName: { type: String },
    url: { type: String },
  },
  coverPic: {
    fileName: { type: String },
    url: { type: String },
  },
  specialization: [{ type: Types.ObjectId, ref: "Specialization" }],
  practiceArea: [{ type: Types.ObjectId, ref: "PracticeArea" }],
  language: [],
  experience_year: { type: Number },
  total_cases: { type: Number },
  isProfileVisible: {
    type: Boolean,
  },
  user: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
});

exports.UserUpdationHistory =
  models.UserUpdationHistory || model("UserUpdationHistory", schema);
