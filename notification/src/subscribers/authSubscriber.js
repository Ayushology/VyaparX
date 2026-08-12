const { subscribeToQueue } = require("../broker/broker");
const { sendEmail } = require("../email");
const {getWelcomeEmailTemplate} = require('../templates/emailTemplates')
module.exports = function () {
    subscribeToQueue(
        'AUTH_NOTIFICATION.USER_CREATED',
        async (data) => {
            console.log('Received message from queue:', data);
            const emailHTMLTemplate = `
                <h1>Welcome to Our Service!</h1>
                <p>
                    Dear ${data.fullName.firstName} ${data.fullName.lastName || ""},
                </p>
                <p>
                    Thank you for registering with us. We're excited to have you on board!
                </p>
                <p>Best regards,<br/>The Team</p>
            `;

            await sendEmail(
                data.email,
                "Welcome to VyaparX",
                "Thank you for registering with us!",
                emailHTMLTemplate
            );
        }
    );
};