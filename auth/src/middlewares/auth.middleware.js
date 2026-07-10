const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const redis = require("../db/redis");
async function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  
    const isBlacklisted = await redis.get(`blacklist:${token}`);

  if (isBlacklisted) {
    return res.status(401).json({
      message: "Unauthorized - Token is blacklisted",
    });
  }
 
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
}

module.exports = { authMiddleware };