const paymentModel = require("../models/payment.model");
const axios = require("axios");
const {publishToqueue} = require('../broker/broker')
const {
  validatePaymentVerification,
} = require("razorpay/dist/utils/razorpay-utils");


require("dotenv").config();
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


async function createPayment(req, res) {
  const token =
    req.cookies?.token ||
    req.headers?.authorization?.split(" ")[1];

  try {
    const { orderId } = req.params;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const orderResponse = await axios.get(
      `http://localhost:3003/api/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const orderData = orderResponse.data.order;

    if (!orderData) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

   const totalPrice = orderData.totalPrice;

if (!totalPrice || !totalPrice.amount || totalPrice.amount <= 0) {
  return res.status(400).json({
    message: "Invalid order amount",
  });
}

const amount = Math.round(totalPrice.amount * 100);

console.log("razorpay amount:", amount);

const razorpayOrder = await razorpay.orders.create({
  amount,
  currency: totalPrice.currency,
  receipt: orderId,
});
    // Save payment in database
    const payment = await paymentModel.create({
      vyaparxOrderId: orderId,

      userId: req.user.id,

      price: {
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },

      razorpayOrderId: razorpayOrder.id,

      status: "PENDING",
    });

    // await publishToQueue(
    //   "PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED",
    //   payment
    // );

    // await publishToQueue(
    //   "PAYMENT_NOTIFICATION.PAYMENT_INITIATED",
    //   {
    //     email: req.user.email,
    //     orderId: orderId,
    //     amount: price.amount / 100,
    //     currency: price.currency,
    //     username: req.user.username,
    //   }
    // );

    return res.status(201).json({
      message: "Payment initiated",

      payment: {
        id: payment._id,
        vyaparxOrderId: payment.vyaparxOrderId,
        razorpayOrderId: payment.razorpayOrderId,
        amount: payment.price.amount,
        currency: payment.price.currency,
      },

      // Frontend needs this to open Razorpay Checkout
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Create Payment Error:", err);

    if (err.response) {
      return res.status(err.response.status || 500).json({
        message:
          err.response.data?.message ||
          "Order service request failed",
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

async function verifyPayment(req, res) {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = req.body;

  try {
    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        message: "Missing payment verification details",
      });
    }

    const payment = await paymentModel.findOne({
      razorpayOrderId,
      userId: req.user.id,
    });
console.log("razorpayOrderId:", razorpayOrderId);
console.log("razorpayPaymentId:", razorpayPaymentId);
console.log("razorpaySignature:", razorpaySignature);
console.log("DB razorpayOrderId:", payment?.razorpayOrderId);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    if (payment.status === "COMPLETED") {
      return res.status(200).json({
        message: "Payment already verified",
        payment,
      });
    }

    const isValid = validatePaymentVerification(
      {
        order_id: payment.razorpayOrderId,
        payment_id: razorpayPaymentId,
      },
      razorpaySignature,
      process.env.RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "COMPLETED";
    payment.paidAt = new Date();

    await payment.save();


    await publishToqueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", {
      email: req.user.email,
      orderId: payment.vyaparxOrderId,
      paymentId: payment.razorpayPaymentId,
      amount: payment.price.amount / 100,
      currency: payment.price.currency,
      username: req.user.username,
      fullName: req.user.firstName + " " + req.user.lastName
    });

    return res.status(200).json({
      message: "Payment verified successfully",
      payment,
    });
  } catch (err) {
    console.error("Verify Payment Error:", err);

    await publishToqueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", {
      email: req.user.email,
      orderId: req.body.orderId,
      paymentId: req.body.razorpayPaymentId
    });
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

module.exports = {
  createPayment,
  verifyPayment,
};