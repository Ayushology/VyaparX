const getWelcomeEmailTemplate = (firstName, lastName = "") => {
    const nameString = lastName ? `${firstName} ${lastName}` : firstName;
    
    return `
        <h1>Welcome to VyaparX!</h1>
        <p>Dear ${nameString},</p>
        <p>Thank you for registering with us. We're excited to have you on board!</p>
        <p>Best regards,<br/>The VyaparX Team</p>
    `;
};
const getPaymentSuccessEmailTemplate = (username, orderId, paymentId, amount, currency) => {
  return `
      <h1>Payment Successful!</h1>
      <p>Dear ${username},</p>
      <p>Your payment of ${amount} ${currency} for order ${orderId} has been processed successfully.</p>
      <p>Payment ID: ${paymentId}</p>
      <p>Best regards,<br/>The VyaparX Team</p>
  `;
};

const getPaymentFailedEmailTemplate = (username, orderId, paymentId) => {
  return `
      <h1>Payment Failed</h1>
      <p>Dear ${username},</p>
      <p>Your payment for order ${orderId} has failed.</p>
      <p>Payment ID: ${paymentId}</p>
      <p>Best regards,<br/>The VyaparX Team</p>
  `;
};

module.exports = {
    getWelcomeEmailTemplate,
    getPaymentSuccessEmailTemplate,
    getPaymentFailedEmailTemplate
};