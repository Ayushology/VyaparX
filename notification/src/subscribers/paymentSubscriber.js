const { subscribeToQueue } = require("../broker/broker");
const { sendEmail } = require("../email");
const { 
    getPaymentSuccessEmailTemplate, 
    getPaymentFailedEmailTemplate 
} = require('../templates/emailTemplates');
const { QUEUE_EVENTS } = require('../config/event');

module.exports = function initializePaymentSubscribers() {
    // Subscriber for successful payments
    subscribeToQueue(
        QUEUE_EVENTS.PAYMENT_SUCCESS,
        async (data) => {
            try {
                console.log(`[Broker] Processing ${QUEUE_EVENTS.PAYMENT_SUCCESS} for: ${data.email}`);
                
                const emailHTMLTemplate = getPaymentSuccessEmailTemplate(
                    data.username || data.fullName,
                    data.orderId,
                    data.paymentId,
                    data.amount,
                    data.currency
                );
                
                await sendEmail(
                    data.email,
                    "Payment Successful - VyaparX",
                    `Your payment for order ${data.orderId} was successful.`,
                    emailHTMLTemplate
                );
                console.log(`[Broker] Successfully sent payment success email to: ${data.email}`);
            } catch (err) {
                console.error(`[Broker] Failed to process ${QUEUE_EVENTS.PAYMENT_SUCCESS}:`, err.message);
            }
        }
    );

    // Subscriber for failed payments
    subscribeToQueue(
        QUEUE_EVENTS.PAYMENT_FAILED,
        async (data) => {
            try {
                console.log(`[Broker] Processing ${QUEUE_EVENTS.PAYMENT_FAILED} for: ${data.email}`);
                
                const emailHTMLTemplate = getPaymentFailedEmailTemplate(
                    data.username || "User",
                    data.orderId,
                    data.paymentId
                );
                
                await sendEmail(
                    data.email,
                    "Payment Failed - VyaparX",
                    `Your payment for order ${data.orderId} failed.`,
                    emailHTMLTemplate
                );
                console.log(`[Broker] Successfully sent payment failed email to: ${data.email}`);
            } catch (err) {
                console.error(`[Broker] Failed to process ${QUEUE_EVENTS.PAYMENT_FAILED}:`, err.message);
            }
        }
    );
};