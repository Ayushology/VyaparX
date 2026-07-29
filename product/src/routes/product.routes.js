const express = require("express");
const upload = require("../services/multer");
const productController = require("../controllers/product.controller");
const {createAuthMiddleware} = require('../middlewares/auth.middleware')
const router = express.Router();

router.post("/",createAuthMiddleware(["admin","seller"]), upload.array("images",5), productController.createProduct);

module.exports = router;
