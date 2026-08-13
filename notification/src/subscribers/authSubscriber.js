const { subscribeToQueue } = require("../broker/broker");
const { sendEmail } = require("../email");
const {getWelcomeEmailTemplate} = require('../templates/emailTemplates');
const {QUEUE_EVENTS} = require('../config/event')
module.exports = function initializeAuthSubscribers () {
    subscribeToQueue(
        QUEUE_EVENTS.USER_CREATED,
        async (data) => {
            try{
                console.log(`[Broker] Processing ${QUEUE_EVENTS.USER_CREATED} for: ${data.email}`);

            // Safely destructure with fallbacks to prevent runtime crashes if payload is malformed
            const { firstName = "User", lastName = "" } = data.fullName || {};
            
            const emailHTMLTemplate = getWelcomeEmailTemplate(firstName, lastName);
            await sendEmail(
                data.email,
                "Welcome to VyaparX",
                "Thank you for registering with us!",
                emailHTMLTemplate
            );
            console.log(`[Broker] Successfully processed welcome email for: ${data.email}`);
            }catch(err){
                console.error(`[Broker] Failed to process ${QUEUE_EVENTS.USER_CREATED} for ${data.email}:`, err.message);
            }
        }
    );
};