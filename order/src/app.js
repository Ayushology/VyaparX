const express = require('express')
const orderRoutes = require('./routes/order.routes')
const app = express();

app.use('/api/orders',orderRoutes);

module.exports = app;