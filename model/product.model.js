const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        marketplaceId: {
            type: String,
            trim: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
        brand: {
            type: String,
            trim: true,
        },
        itemName: {
            type: String,
            trim: true,
        },
        asin: {
            type: String,
            trim: true,
        },
     
        image: {
            type: String,
            trim: true,
        },
        itemClassification: {
            type: String,
            trim: true,
        },
        modelNumber: {
            type: String,
            trim: true,
        },
        manufacturer: {
            type: String,
            trim: true,
        },
      
    },
    {
        timestamps: true,
    }
);

module.exports = new mongoose.model("product", productSchema);
