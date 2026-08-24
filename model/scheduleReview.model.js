const mongoose = require("mongoose");

const scheduleReviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
        orderId: {
            type: String,
            trim: true,
        },
        afterDays: {
            type: Number,
            trim: true,
        },
        isActive: {
            type: Boolean,
            trim: true,
        },
        scheduleDate: {
            type: String,
            trim: true,
        },
        reviewStatus: {
            type: String,
            enum: ["Pending", "Requested", "Failed"],
            default: "Pending",
        },
        reviewCancelReason: {
            type: String,
            trim: true
        },
        isAutomated: {
            type: Boolean,
            trim: true,
        },
      
    },
    {
        timestamps: true,
    }
);

module.exports = new mongoose.model("scheduleReview", scheduleReviewSchema);
