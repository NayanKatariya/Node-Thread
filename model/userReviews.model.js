const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
    },
    phoneNumber: {
      type: Number,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
    },
    otpCode: {
      type: Number,
      default: null,
    },
    otpExpireIn: {
      type: Number,
      default: null,
    },
    role: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = new mongoose.model("user", userSchema);
