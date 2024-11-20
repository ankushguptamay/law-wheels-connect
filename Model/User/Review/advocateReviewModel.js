const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    rating: { type: Number },
    messages: [
      {
        givenBy: { type: Types.ObjectId, ref: "User" },
        message: { type: String },
        createdAt: { type: Date },
      },
    ],
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
    client: { type: Types.ObjectId, ref: "User", required: true },
    advocate: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

exports.AdvocateReview =
  models.AdvocateReview || model("AdvocateReview", schema);
