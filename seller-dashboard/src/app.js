const express  = require('express')

const cookieParser = require('cookie-parser');
const app = express();
const sellerDashboardRoute = require('./routes/sellerdashboard.routes')

app.use(express.json());
app.use(cookieParser());
app.use('/api/seller-dashboard',sellerDashboardRoute);

module.exports = app;