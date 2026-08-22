const express = require('express')
const cookieParser = require('cookie-parser')
const app = express();
const paymentRoutes = require('./routes/payment.routes')

app.get('/', (req, res) => {
  res.status(200).json({ message: "Welcome to the Payment Service" });
});

app.use(cookieParser());
app.use(express.json());

app.use('/api/payments',paymentRoutes); 
module.exports = app;