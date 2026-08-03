const express = require('express')
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware')
const cartController = require("../controllers/cart.controller")
router.post("/items",authMiddleware.createAuthMiddleware["buyer"],cartController.addItemToCart)

module.exports = router