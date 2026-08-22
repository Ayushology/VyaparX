const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

app.use(express.json());
app.use(cookieParser());

// auth routes
const authRouter = require("./routes/auth.route");
app.get('/', (req, res) => {
  res.status(200).json({ message: "Welcome to the Auth Service" });
});
app.use("/auth", authRouter);

module.exports = app;
