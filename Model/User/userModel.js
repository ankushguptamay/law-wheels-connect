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
    headLine: {
      type: String,
    },
    bar_council_license_number: {
      type: Number,
    },
    userCode: {
      type: String,
      unique: true,
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
    isAdvocate: {
      type: Boolean, // If Value is true then user is advocate, if false user is student and if null none of the above
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
