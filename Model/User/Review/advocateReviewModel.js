const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    messages: [
      {
        givenBy: { type: Types.ObjectId, ref: "User" },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
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

schema.pre("find", function () {
  this.where({ isDelete: false });
});

exports.AdvocateReview =
  models.AdvocateReview || model("AdvocateReview", schema);
