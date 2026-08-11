const express = require('express')
const {connect,subscribeToQueue} = require('../src/broker/broker')
const setListeners = require('../src/broker/listeners')

const app = express();
connect().then(() => {
    setListeners();
})
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Notification service is running"
    });
})

module.exports = app;