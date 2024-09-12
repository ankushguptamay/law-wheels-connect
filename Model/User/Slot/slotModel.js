const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    date: { type: Date },
    time: { type: String },
    password: { type: Number, required: true },
    timeInMin: { type: String },
    isBooked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    deleted_at: { type: Date },
    client: { type: Types.ObjectId, ref: "User" },
    advocate: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

exports.Slot = models.Slot || model("Slot", schema);
