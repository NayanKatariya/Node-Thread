const mongoose = require("mongoose");

const sellerAccountsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    sellerEmail: {
      type: String,
      trim: true,
    },
    accessToken: {
      type: String,
      trim: true,
    },
    refreshToken: {
      type: String,
      trim: true,
    },
    tokenExpire: {
      type: Number,
      trim: true,
    },
    clientId: {
      type: String,
      trim: true,
    },
    appId: {
      type: String,
      trim: true,
    },
    clientSecret: {
      type: String,
      trim: true,
    },
    role: {
      type: Number,
    },

    country: {
      type: String,
      trim: true,
    },
    uid: {
      type: String,
      trim: true,
    },
    sellerId: {
      type: String,
      trim: true,
    },
    tokens: {
      access_token: String,
      refresh_token: String,
      scope: String,
      token_type: String,
      expiry_date: Date,
    },
    marketplaceId: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
module.exports = new mongoose.model("account", sellerAccountsSchema);
