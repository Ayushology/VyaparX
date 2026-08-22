const express = require('express');
const cookieParser = require('cookie-parser');
const sellerRoutes = require('./routes/sellerdashboard.routes');

const app = express();


app.use(express.json());
app.use(cookieParser());


app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to Seller-Dashboard Service.' });
});

app.use("/api/seller/dashboard", sellerRoutes);


module.exports = app;