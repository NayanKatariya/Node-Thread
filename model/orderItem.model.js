const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
        orderId: {
            type: String,
            trim: true,
        },
        asin: {
            type: String,
            trim: true,
        },
        title: {
            type: String,
            trim: true,
        },
        sellerSKU: {
            type: String,
            trim: true,
        },
        mainImage: {
            type: String,
            trim: true,
        },
        orderItemId: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = new mongoose.model("orderItem", orderItemSchema);
