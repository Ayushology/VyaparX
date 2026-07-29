const express = require("express");
const upload = require("../services/multer");
const productController = require("../controllers/product.controller");
const { createAuthMiddleware } = require("../middlewares/auth.middleware");
const { uploadProductImages } = require("../middlewares/upload.middleware");
const { validateCreateProduct } = require("../validators/product.validator");
const router = express.Router();



router.post(
  "/",
  createAuthMiddleware(["admin", "seller"]),
  uploadProductImages,
  validateCreateProduct,
  productController.createProduct,
);

module.exports = router;
