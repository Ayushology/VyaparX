const express = require('express')
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware')
const cartController = require("../controllers/cart.controller")
const validation = require('../validators/items.validator')
router.post("/items",validation.validateItemToCart,authMiddleware.createAuthMiddleware["buyer"],cartController.addItemToCart)

module.exports = router