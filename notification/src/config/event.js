// /*
//  * As VyaparX grows, you can group these by domain to keep them organized.
//  */
const QUEUE_EVENTS = {
    // Auth & User Lifecycle Events
    USER_CREATED: 'AUTH_NOTIFICATION.USER_CREATED',
    // Payment Events
    PAYMENT_SUCCESS: 'PAYMENT_NOTIFICATION.PAYMENT_SUCCESS',
    PAYMENT_FAILED: 'PAYMENT_NOTIFICATION.PAYMENT_FAILED',
};

module.exports = {
    QUEUE_EVENTS
};