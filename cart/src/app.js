const express = require('express');
const app = express();
const cartRoutes = require("../src/routes/cart.routes")
const cookieParser = require('cookie-parser')
app.use(express.json());
app.use(cookieParser());

app.use("/api/cart",cartRoutes)
module.exports = app;
