const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    skillName: {
      type: String,
      required: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
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

exports.UserSkill = models.UserSkill || model("UserSkill", schema);
