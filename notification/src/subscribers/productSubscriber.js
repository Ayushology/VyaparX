const { subscribeToQueue } = require("../broker/broker");
const { sendEmail } = require("../email");
const { QUEUE_EVENTS } = require("../config/event");
const {
    getProductCreatedEmailTemplate
} = require("../templates/emailTemplates");

module.exports = function initializeProductSubscribers() {

    subscribeToQueue(
        QUEUE_EVENTS.PRODUCT_CREATED,
        async (data) => {
            try {
                console.log(
                    `[Broker] Processing ${QUEUE_EVENTS.PRODUCT_CREATED} for: ${data.email}`
                );

                const html = getProductCreatedEmailTemplate(
                    data.username,
                    data.productId
                );

                await sendEmail(
                    data.email,
                    "Product Created Successfully",
                    "",
                    html
                );

                console.log(
                    `[Email] Product creation email sent to ${data.email}`
                );

            } catch (error) {
                console.error(
                    `[Broker] Error processing ${QUEUE_EVENTS.PRODUCT_CREATED}:`,
                    error
                );
            }
        }
    );
};