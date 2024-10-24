const { Schema, model, models } = require("mongoose");

const schema = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isMobileNumberVerified: {
      type: Boolean,
      default: false,
    },
    isLicenseVerified: {
      type: Boolean,
      default: false,
    },
    headLine: {
      type: String,
    },
    bar_council_license_number: {
      type: String,
    },
    userCode: {
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
    role: {
      type: String,
      enum: {
        values: ["Advocate", "Student", "Nun"],
        message: "{VALUE} is not supported",
      },
    },
    isProfileVisible: {
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

exports.User = models.User || model("User", schema);
