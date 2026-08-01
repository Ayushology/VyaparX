const express = require("express");
const upload = require("../services/multer");
const productController = require("../controllers/product.controller");
const { createAuthMiddleware } = require("../middlewares/auth.middleware");
const { uploadProductImages } = require("../middlewares/upload.middleware");
const { validateCreateProduct } = require("../validators/product.validator");
const {validateUpdateProduct }  = require("../validators/updateProduct.validator")
const router = express.Router();

// POST /api/products
router.post("/",createAuthMiddleware(["admin", "seller"]),uploadProductImages, validateCreateProduct, productController.createProduct);
// GET /api/products
router.get("/", productController.getProduct);
// GET /api/products/:id
router.get("/:id", productController.getProductById);
// PATCH /api/products/:id
router.patch("/:id", createAuthMiddleware(["admin", "seller"]), uploadProductImages, validateUpdateProduct,productController.updateProduct);
// DELETE /api/products/:id
router.delete("/:id",createAuthMiddleware(["seller","admin"]),productController.deleteProduct);
module.exports = router;



