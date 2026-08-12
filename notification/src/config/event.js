// /*
//  * As VyaparX grows, you can group these by domain to keep them organized.
//  */
const QUEUE_EVENTS = {
    // Auth & User Lifecycle Events
    USER_CREATED: 'AUTH_NOTIFICATION.USER_CREATED',
    // PASSWORD_RESET: 'AUTH_NOTIFICATION.PASSWORD_RESET',
    // EMAIL_VERIFICATION: 'AUTH_NOTIFICATION.EMAIL_VERIFICATION',
    // USER_DELETED: 'AUTH_NOTIFICATION.USER_DELETED',

    // Examples of future domains you might add:
    
    // Billing Events
    // SUBSCRIPTION_STARTED: 'BILLING.SUBSCRIPTION_STARTED',
    // PAYMENT_FAILED: 'BILLING.PAYMENT_FAILED',

    // Application/Clinic Events
    // APPOINTMENT_BOOKED: 'CLINIC.APPOINTMENT_BOOKED',
    // REPORT_GENERATED: 'CLINIC.REPORT_GENERATED'
};

module.exports = {
    QUEUE_EVENTS
};