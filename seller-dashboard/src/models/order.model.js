  const mongoose = require("mongoose");

  const addressSchema = new mongoose.Schema({
    street: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    zip: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      required: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  });

  const orderSchema = new mongoose.Schema(
    {
      user: {
        type: String,
        required: true,
        index: true,
      },

      items: [
        {
          product: {
            type: String,
            required: true,
          },

          seller: {
            type: String,
            required: true,
            index: true,
          },

          quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
          },

          price: {
            amount: {
              type: Number,
              required: true,
              min: 0,
            },

            currency: {
              type: String,
              required: true,
              enum: ["USD", "INR"],
              default: "INR",
            },
          },
        },
      ],

      status: {
        type: String,
        enum: [
          "PENDING",
          "DELIVERED",
          "SHIPPED",
          "CONFIRMED",
          "CANCELLED",
        ],
        default: "PENDING",
      },

      totalPrice: {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },

        currency: {
          type: String,
          required: true,
          enum: ["USD", "INR"],
          default: "INR",
        },
      },

      shippingAddress: {
        type: addressSchema,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );
orderSchema.index({ "items.seller": 1, status: 1, createdAt: -1 });
  const orderModel = mongoose.model("Order", orderSchema);

  module.exports = orderModel;