const express = require('express')
const orderRoutes = require('./routes/order.routes')
const cookieParser = require('cookie-parser')
const app = express();
app.use(express.json());
app.use(cookieParser())
app.use('/api/orders',orderRoutes);

module.exports = app;