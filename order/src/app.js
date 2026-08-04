const express = require('express')
const orderRoutes = require('./routes/order.routes')
const app = express();

app.use('/api/order',orderRoutes);

module.exports = app;