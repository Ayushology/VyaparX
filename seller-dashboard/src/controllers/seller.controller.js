const mongoose = require("mongoose");
const orderModel = require("../models/order.model");
const productModel = require("../models/product.model");

// Helper function to safely extract the seller ID from the request
function getSellerId(req) {
  if (!req.user) throw new Error("User object missing from request");
  
  // Checks if middleware set it as _id, id, or just passed the string directly
  const id = req.user._id || req.user.id || (typeof req.user === 'string' ? req.user : null);
  
  if (!id) throw new Error("Could not find user ID in req.user");
  
  return id.toString();
}

/**
 * GET /seller/metrics
 * Computes sales, revenue, and top products directly in MongoDB.
 */
/**
 * GET /seller/metrics
 * Computes sales, revenue, and top products directly in MongoDB.
 */
async function getMetrics(req, res) {
  try {
    const sellerId = getSellerId(req);

    // Included "PENDING" so test orders reflect in the dashboard.
    const validStatuses = ["CONFIRMED", "SHIPPED", "DELIVERED", "PENDING"];

    const [metricsResult, topProductsResult] = await Promise.all([
      // Aggregation 1: Total Sales & Revenue for this seller
      orderModel.aggregate([
        {
          $match: {
            "items.seller": sellerId,
            status: { $in: validStatuses },
          },
        },
        { $unwind: "$items" },
        {
          $match: {
            "items.seller": sellerId,
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$items.quantity" },
            totalRevenue: {
              $sum: { $multiply: ["$items.price.amount", "$items.quantity"] },
            },
          },
        },
      ]),

      // Aggregation 2: Top 5 Sold Products with product metadata
      orderModel.aggregate([
        {
          $match: {
            "items.seller": sellerId,
            status: { $in: validStatuses },
          },
        },
        { $unwind: "$items" },
        {
          $match: {
            "items.seller": sellerId,
          },
        },
        {
          $group: {
            _id: "$items.product",
            sold: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.price.amount", "$items.quantity"] },
            },
          },
        },
        { $sort: { sold: -1 } },
        { $limit: 5 },
        // --- NEW FIX: Convert string ID to ObjectId for matching ---
        {
          $addFields: {
            productObjectId: {
              $convert: {
                input: "$_id",
                to: "objectId",
                onError: "$_id", // Fallback just in case it's already an ObjectId
                onNull: null
              }
            }
          }
        },
        {
          $lookup: {
            from: "products", // Note: Make sure your mongodb collection is actually named 'products'
            localField: "productObjectId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        // -----------------------------------------------------------
        { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            id: "$_id",
            title: { $ifNull: ["$productDetails.title", "Unknown Product"] },
            sold: 1,
            revenue: 1,
          },
        },
      ]),
    ]);

    const sales = metricsResult[0]?.totalSales || 0;
    const revenue = metricsResult[0]?.totalRevenue || 0;

    return res.status(200).json({
      success: true,
      data: {
        sales,
        revenue,
        topProducts: topProductsResult,
      },
    });
  } catch (error) {
    console.error("Error fetching metrics:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
}
/**
 * GET /seller/orders
 * Returns paginated orders containing only this seller's items.
 */


async function getOrders(req, res) {
  try {
    const sellerId = getSellerId(req);
    
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      orderModel
        .find({ "items.seller": sellerId })
        // Note: .populate() is removed here because of the String vs ObjectId mismatch
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      orderModel.countDocuments({ "items.seller": sellerId }),
    ]);

    // --- NEW FIX: Manual Population for Products ---
    // 1. Gather all unique product IDs from these orders
    const productIds = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.seller && item.seller.toString() === sellerId) {
          productIds.push(item.product);
        }
      });
    });

    // 2. Fetch the products (Mongoose will automatically convert our strings to ObjectIds here!)
    const products = await productModel.find(
      { _id: { $in: productIds } }, 
      "title images price"
    ).lean();

    // 3. Create a dictionary for instant lookups
    const productMap = {};
    products.forEach(p => {
      productMap[p._id.toString()] = p;
    });
    // -----------------------------------------------

    // Keep only the items that belong to the requesting seller and attach product details
    const filteredOrders = orders.map((order) => {
      const sellerItems = order.items
        .filter((item) => item.seller && item.seller.toString() === sellerId)
        .map(item => ({
          ...item,
          // Replace the raw string ID with the actual product object from our map
          product: productMap[item.product.toString()] || { 
            _id: item.product, 
            title: "Unknown Product" 
          }
        }));

      const sellerSubtotal = sellerItems.reduce(
        (acc, item) => acc + item.price.amount * item.quantity,
        0
      );

      return {
        ...order,
        items: sellerItems,
        sellerSubtotal,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        orders: filteredOrders,
        pagination: {
          total: totalOrders,
          page,
          limit,
          totalPages: Math.ceil(totalOrders / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
}

/**
 * GET /seller/products
 * Returns paginated list of products owned by the seller.
 */
async function getProducts(req, res) {
  try {
    const sellerId = getSellerId(req);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      productModel
        .find({ seller: sellerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      productModel.countDocuments({ seller: sellerId }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
}


/**
 * GET /seller/products/low-stock
 * Returns products that have low inventory (stock < 5).
 */
async function getLowStockAlerts(req, res) {
  try {
    const sellerId = getSellerId(req);
    
    // Default threshold is now 5
    const threshold = parseInt(req.query.threshold, 10) || 5;

    // Use $lt (less than) so it triggers for 4, 3, 2, 1, 0. 
    // (If you want it to trigger on exactly 5 as well, change $lt back to $lte)
    const lowStockProducts = await productModel
      .find({ 
        seller: sellerId, 
        stock: { $lt: threshold } 
      })
      .select("title images price stock") 
      .sort({ stock: 1 }) 
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        count: lowStockProducts.length,
        threshold,
        products: lowStockProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching low stock alerts:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
}

module.exports = {
  getMetrics,
  getOrders,
  getProducts,
  getLowStockAlerts,
};