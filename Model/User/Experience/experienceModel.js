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
    startDate: { type: Date },
    endDate: { type: Date },
    description: {
      type: String,
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

exports.Experience = models.Experience || model("Experience", schema);
