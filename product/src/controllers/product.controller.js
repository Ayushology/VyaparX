const ProductModel = require("../models/product.model");
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

    return res.status(201).json({
      success: true,
      data: product,
    });
  }catch (error) {
  console.error(error);   // Print the full stack trace

  return res.status(500).json({
    success: false,
    message: error.message,
    stack: error.stack, // temporarily for debugging
  });
}
}

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

module.exports = { createProduct, getProduct };
