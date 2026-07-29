const ProductModel = require("../models/product.model");
const Product = ProductModel.default || ProductModel;
const { uploadImage } = require("../services/imagekit.service");

async function createProduct(req, res) {
  try {
    const {
      title,
      description,
      price,
      currency = "INR",
      category,
      stock = 1,
    } = req.body;

    // SECURITY: Always grab the seller ID from the verified JWT, never from req.body
    const seller = req.user && req.user.id;

    if (!seller) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Seller identity missing.",
      });
    }

    if (!title || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required product fields.",
      });
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (
      isNaN(numericPrice) ||
      numericPrice < 0 ||
      isNaN(numericStock) ||
      numericStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Price and stock must be valid non-negative numbers.",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product image is required.",
      });
    }

    const uploadedImages = await Promise.all(
      req.files.map((file) => uploadImage(file.buffer, file.originalname)),
    );

    const formattedImages = uploadedImages.map((img) => ({
      url: img.url,
      thumbnail: img.thumbnail,
      id: img.fileId,
    }));

    const product = await Product.create({
      title,
      description,
      price: {
        amount: numericPrice,
        currency,
      },
      category,
      stock: numericStock,
      seller,
      images: formattedImages,
    });

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not create product.",
    });
  }
}

module.exports = { createProduct };
