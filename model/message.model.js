const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        marketplaceId: {
            type: String,
            trim: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
        accountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "account",
        },
        orderId: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            trim: true,
        },
        message: {
            type: String,
            trim: true,
        },
        isFetched: {
            type: Boolean,
            default: false,
        },
        replied: {
            type: Boolean,
            default: false,
        },
        sender: {
            type: String,
            trim: true,
        },
        receiver: {
            type: String,
            trim: true,
        },
        messageDate: {
            type: Date,
            trim: true,
        },
        actions: [{
            href: {
                type: String,
            },
            name: {
                type: String,
            }
        }]
    },
    {
        timestamps: true,
    }
);

module.exports = new mongoose.model("message", messageSchema);
