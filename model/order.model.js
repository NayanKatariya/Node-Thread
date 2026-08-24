const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        marketplaceId: {
            type: String,
            trim: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },

        orderId: {
            type: String,
            trim: true,
        },
        shipDate: {
            type: String,
            trim: true,
        },
        deliveryDate: {
            type: Date,
            trim: true,
        },
        asin: {
            type: String,
            trim: true,
        },
        color: {
            type: String,
            trim: true,
        },
        buyerEmail: {
            type: String,
            trim: true,
        },
        
        numberOfItemsShipped: {
            type: String,
            trim: true,
        },

        orderTotal: {
            currencyCode: {
                type: String,
                trim: true
            },
            amount: {
                type: String,
                trim: true
            }
        },
        shippingAddress: {
            stateOrRegion: {
                type: String,
                trim: true
            },
            postalCode: {
                type: String,
                trim: true
            },
            city: {
                type: String,
                trim: true
            },
            CountryCode: {
                type: String,
                trim: true
            }
        },
        shipmentServiceLevelCategory: {
            type: String,
            trim: true,
        },
       
    },
    {
        timestamps: true,
    }
);

module.exports = new mongoose.model("order", orderSchema);
