const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const cartController = require("../controllers/cart.controller");
const validation = require("../validators/items.validator");

// GET /api/cart - Get the current user's cart
router.get("/",authMiddleware.createAuthMiddleware(["buyer"]),cartController.getCart);
// POST /api/cart/items - Add an item to the cart
router.post("/items",authMiddleware.createAuthMiddleware(["buyer"]),validation.validateItemToCart,cartController.addItemToCart);
// PATCH /api/cart/items/:productId - Update the quantity of an item in the cart
router.patch("/items/:productId",authMiddleware.createAuthMiddleware(["buyer"]),validation.validateUpdateItemInCart,cartController.updateItemInCart);
// DELETE /api/cart - Delete the current user's cart
router.delete("/",authMiddleware.createAuthMiddleware(["buyer"]),cartController.deleteCart);
// DELETE /api/cart/items/:productId - Remove an item from the cart
router.delete("/items/:productId",authMiddleware.createAuthMiddleware(["buyer"]),cartController.removeItemFromCart);

module.exports = router;
