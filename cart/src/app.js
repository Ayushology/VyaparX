const express = require('express');
const app = express();

// Importing Routes
const cartRoutes = require("../src/routes/cart.routes")
const cookieParser = require('cookie-parser')
// Home route
app.get('/', (req, res) => {
  res.status(200).json({ message: "Welcome to the Cart Service" });
});
// Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/cart",cartRoutes)
module.exports = app;
