const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

app.use(express.json());
app.use(cookieParser());

// auth routes
const authRouter = require("./routes/auth.route");
app.use("/auth", authRouter);

module.exports = app;
