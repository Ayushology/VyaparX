const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const cartController = require("../controllers/cart.controller");
const validation = require("../validators/items.validator");
router.post(
  "/items",
  authMiddleware.createAuthMiddleware(["buyer"]),
  validation.validateItemToCart,
  cartController.addItemToCart,
);
router.patch(
  "/items/:productId",
  authMiddleware.createAuthMiddleware(["buyer"]),
  validation.validateUpdateItemInCart,
  cartController.updateItemInCart,
);

module.exports = router;
