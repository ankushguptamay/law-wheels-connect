const { Schema, model, models, Types } = require("mongoose");

const schema = new Schema(
  {
    follower: [
      {
        followerId: {
          type: Types.ObjectId,
          ref: "User",
          required: true,
        },
        profilePic: {
          type: String,
        },
        name: {
          type: String,
        },
      },
    ],
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

exports.Follower = models.Follower || model("Follower", schema);
