const { Schema, model, models } = require("mongoose");

const schema = new Schema({
  otp: {
    type: Number,
  },
  validTill: {
    type: String,
  },
  receiverId: {
    type: String,
  },
});

exports.OTP = models.OTP || model("otp", schema);
