const mongoose = require("mongoose");

// Define a schema for vectorStore
const fileContentSchema = new mongoose.Schema(
  {
    file: { type: String },

    text: { type: String },
    embedding: { type: [Number] },
    asin: { type: String  },
  },
  { timestamps: true }
);

// Create a model from the schema
module.exports = mongoose.model("file-content", fileContentSchema);
