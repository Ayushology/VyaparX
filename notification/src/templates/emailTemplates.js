const getWelcomeEmailTemplate = (firstName, lastName = "") => {
    const nameString = lastName ? `${firstName} ${lastName}` : firstName;
    
    return `
        <h1>Welcome to VyaparX!</h1>
        <p>Dear ${nameString},</p>
        <p>Thank you for registering with us. We're excited to have you on board!</p>
        <p>Best regards,<br/>The VyaparX Team</p>
    `;
};

module.exports = {
    getWelcomeEmailTemplate
};