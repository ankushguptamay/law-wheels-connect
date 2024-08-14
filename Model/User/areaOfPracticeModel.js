const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    practiceArea: {
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

exports.UserPracticeArea =
  models.UserPracticeArea || model("UserPracticeArea", schema);
