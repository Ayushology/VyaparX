const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    price: {
      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        enum: ["INR", "USD"],
        default: "INR",
      },
    },

    category: {
      type: String,
      required: true,
      index: true,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },

    seller: {
      type: String,
      required: true,
      index: true,
    },

    images: [
      {
        url: {
          type: String,
          required: true,
        },

        thumbnail: {
          type: String,
        },

        id: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;