const { ref } = require("joi");
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
    },
    phoneNumber: {
      type: Number,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
    },
    verificationCode: {
      type: Number,
      default: null,
    },
    verificationExpireIn: {
      type: Number,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    uid: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      default: null,
    },
    customerSupportAutomation: {
      type: Boolean,
      default: false,
    },
    role: {
      type: Number,
    },
    tokens: {
      access_token: String,
      refresh_token: String,
      scope: String,
      token_type: String,
      expiry_date: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = new mongoose.model("user", userSchema);
