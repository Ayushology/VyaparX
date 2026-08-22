const express = require('express')
const {connect,subscribeToQueue} = require('../src/broker/broker')
const initializeAuthSubscribers = require('../src/subscribers/authSubscriber')
const initializeProductSubscribers = require('../src/subscribers/productSubscriber')
const initializePaymentSubscribers = require('../src/subscribers/paymentSubscriber')
const app = express();
connect()
.then(() => {
   console.log('[Broker] Successfully connected. Initializing listeners...');
        initializeAuthSubscribers();
        initializeProductSubscribers();
        initializePaymentSubscribers();
})
.catch((error) => {
        console.error('[Broker] Failed to connect on startup:', error.message);
    });
app.get("/", (req, res) => {
    res.status(200).json({
        service: "Notification Service",
        status: "Running",
        timestamp: new Date().toISOString()
    });
});
module.exports = app;