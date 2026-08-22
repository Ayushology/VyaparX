const { subscribeToQueue } = require("./broker");

const userModel = require("../models/user.model");
const productModel = require("../models/product.model");
const paymentModel = require("../models/payment.model");
const orderModel = require("../models/order.model");

module.exports = async function () {

    subscribeToQueue(
        "AUTH_SELLER_DASHBOARD.USER_CREATED",
        async (user) => {
            try {
                await userModel.create(user);
            } catch (err) {
                console.log(
                    "Error in creating user in seller-dashboard:",
                    err
                );
            }
        }
    );

    subscribeToQueue(
        "PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED",
        async (product) => {
            try {
                await productModel.create(product);
            } catch (err) {
                console.log(
                    "Error in creating product in seller-dashboard:",
                    err
                );
            }
        }
    );

    subscribeToQueue(
        "ORDER_SELLER_DASHBOARD.ORDER_CREATED",
        async (order) => {
            try {
                await orderModel.create(order);
            } catch (err) {
                console.log(
                    "Error in creating order in seller-dashboard:",
                    err
                );
            }
        }
    );

    subscribeToQueue(
        "PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED",
        async (payment) => {
            try {
                await paymentModel.create(payment);
            } catch (err) {
                console.log(
                    "Error in creating payment in seller-dashboard:",
                    err
                );
            }
        }
    );

    subscribeToQueue(
        "PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATE",
        async (payment) => {
            try {
                await paymentModel.findOneAndUpdate(
                    {
                        vyaparxOrderId: payment.vyaparxOrderId,
                    },
                    {
                        ...payment,
                    }
                );

                console.log(
                    `Payment updated in seller-dashboard: ${payment.vyaparxOrderId}`
                );

            } catch (err) {
                console.log(
                    "Error in updating payment in seller-dashboard:",
                    err
                );
            }
        }
    );
};