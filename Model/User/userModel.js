const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    isEmailVerified: { type: Boolean, default: false },
    isMobileNumberVerified: { type: Boolean, default: false },
    licenseIssueYear: { type: Date },
    isLicenseVerified: { type: Boolean, default: false },
    profession_nun_user: { type: String },
    headLine: { type: String }, // Using as Bio
    bar_council_license_number: { type: String },
    userCode: { type: String },
    refreshToken: { type: String },
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
    lastLogin: { type: Date, default: Date.now },
    role: {
      type: String,
      enum: {
        values: ["Advocate", "Student", "Nun"],
        message: "{VALUE} is not supported",
      },
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (value) => Math.round(value * 10) / 10, // Rounds to 1 decimal place
    },
    isAadharVerified: { type: Boolean, default: false },
    aadharDetails: { type: Object },
    specialization: [{ type: Types.ObjectId, ref: "Specialization" }],
    practiceArea: [{ type: Types.ObjectId, ref: "PracticeArea" }],
    language: [],
    experience_year: { type: Number },
    total_cases: { type: Number },
    isProfileVisible: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  { timestamps: true }
);

exports.User = models.User || model("User", schema);
