const ProductModel = require("../models/product.model");
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const { uploadImage } = require("../services/imagekit.service");
const { deleteBulkImages } = require("../services/imagekit.service")
const mongoose = require("mongoose");
const {publishToqueue} = require('../broker/broker')
// CREATE PRODUCT CONTROLLER
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

    const product = await ProductModel.create({
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
    await publishToqueue('PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED',product);
    await publishToqueue('PRODUCT_NOTIFICATION.PRODUCT_CREATED',{ 
      email : req.user.email,
      username : req.user.username,
      productId: product._id , 
      sellerId : seller});
    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error); // Print the full stack trace

    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack, // temporarily for debugging
    });
  }
}
// GET PRODUCTS CONTROLLER
async function getProduct(req, res) {
  try {
    const {
      q,
      minPrice,
      maxPrice,
      category,
      skip = 0, // Number of matching products to skip (used for pagination)
      limit = 10, // Maximum number of products to return in a single response
    } = req.query;

    const filter = {};

    // Search by product title

    if (q) {
      const safeQuery = escapeRegex(q.trim());

      filter.title = {
        // Regex performs pattern matching.
        // Example: "iphon" will match titles containing "iphone".
        // escapeRegex() prevents regex injection and special character issues.
        $regex: safeQuery,

        // "i" => case-insensitive search
        // iphone, IPHONE, iPhone all match
        $options: "i",
      };
    }

    // Filter by category
    if (category) {
      filter.category = category.trim();
    }

    /*
      Example filter after title + category:

      {
        title: {
          $regex: "iphone",
          $options: "i"
        },
        category: "Electronics"
      }

      MongoDB interprets this as:

      title contains "iphone"
      AND
      category equals "Electronics"
    */

    // Filter by price range
    // =========================
    if (minPrice || maxPrice) {
      // Access nested field using dot notation
      // price.amount refers to:
      // {
      //   price: {
      //     amount: Number
      //   }
      // }
      filter["price.amount"] = {};

      if (minPrice) {
        // $gte = Greater Than or Equal To
        filter["price.amount"].$gte = Number(minPrice);
      }

      if (maxPrice) {
        // $lte = Less Than or Equal To
        filter["price.amount"].$lte = Number(maxPrice);
      }
    }

    // Convert query strings to numbers
    const numericSkip = Number(skip);
    const numericLimit = Number(limit);

    // Prevent clients from requesting too many products at once
    // Example:
    // limit=1000 -> only 20 products will be returned
    const safeLimit = Math.min(numericLimit, 20);

    // Run both database operations in parallel
    // 1. Fetch paginated products
    // 2. Count total matching products
    const [products, totalProducts] = await Promise.all([
      ProductModel.find(filter)
        .skip(numericSkip) // Skip first N matching products
        .limit(safeLimit) // Return at most safeLimit products
        .sort({ createdAt: -1 }), // Newest products first

      ProductModel.countDocuments(filter),
    ]);

    // Calculate total pages
    // Example:
    // totalProducts = 95
    // safeLimit = 10
    // totalPages = 10
    const totalPages = Math.ceil(totalProducts / safeLimit) || 1;

    // Determine current page from skip and limit
    // Example:
    // skip = 20, limit = 10
    // currentPage = 3
    const currentPage = Math.floor(numericSkip / safeLimit) + 1;

    return res.status(200).json({
      success: true,

      pagination: {
        totalProducts, // Total products matching filters
        totalPages, // Total pages available
        currentPage, // Current page being viewed
        count: products.length, // Products returned in this response
      },

      products,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
}
// GET PRODUCT BY ID CONTROLLER
async function getProductById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "No product found.",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    console.error("Error fetching product by ID:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product details.",
    });
  }
}
// UPDATE PRODUCT CONTROLLER
async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (
      product.seller.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this product.",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "price",
      "currency",
      "category",
      "stock",
      "images",
    ];

    const hasUpdates = allowedFields.some(
      (field) => req.body[field] !== undefined
    );

    if (!hasUpdates) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}
// DELETE PRODUCT CONTROLLER
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (
      product.seller.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can delete only your products.",
      });
    }

    if (product.images && product.images.length > 0) {
      const fileIds = product.images
        .map((img) => img.id)
        .filter((id) => Boolean(id));

      if (fileIds.length > 0) {
        await deleteBulkImages(fileIds).catch((err) =>
          console.warn(
            "[Delete Controller Warning] Cloud image cleanup encountered an issue:",
            err.message
          )
        );
      }
    }

    await product.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}
// GET ALL PRODUCTS BY SELLER CONTROLLER
async function getAllProductsBySeller(req, res) {
  try {
    const seller = req.user;
    const { skip = 0, limit = 10 } = req.query;

    const numericSkip = Math.max(Number(skip) || 0, 0);
    const numericLimit = Math.max(Number(limit) || 10, 1);
    const safeLimit = Math.min(numericLimit, 20);

    const filter = { seller: seller.id };

    const [products, totalProducts] = await Promise.all([
      ProductModel.find(filter)
        .skip(numericSkip)
        .limit(safeLimit)
        .sort({ createdAt: -1 }),
      ProductModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalProducts / safeLimit) || 1;
    const currentPage = Math.floor(numericSkip / safeLimit) + 1;

    return res.status(200).json({
      success: true,
      pagination: {
        totalProducts,
        totalPages,
        currentPage,
        count: products.length,
      },
      products,
    });
  } catch (error) {
    console.error("Get All Products by Seller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}
// CHECK STOCK CONTROLLER
async function checkStock(req, res) {
  try {
    const { id } = req.params;
    const { quantity } = req.query;

    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const requestedQuantity = Number(quantity);

    return res.status(200).json({
      success: true,
      productId: product._id,
      availableStock: product.stock,
      requestedQuantity,
      inStock: product.stock >= requestedQuantity,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
// UPDATE STOCK CONTROLLER
async function decreaseStock(req, res) {
  try {
    const { id } = req.params;
    const quantity = Number(req.body.quantity);

    const product = await ProductModel.findOneAndUpdate(
      {
        _id: id,
        stock: { $gte: quantity },
      },
      {
        $inc: {
          stock: -quantity,
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

module.exports = {
  createProduct,
  getProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProductsBySeller,
  decreaseStock,
  checkStock,
};
