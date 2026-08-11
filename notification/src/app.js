const express = require('express')
const {connect} = require('../src/broker/broker')
const app = express();

app.get('/',(req,res)=>{
    res.send("Notification Service is up and running.")
})


module.exports = app;