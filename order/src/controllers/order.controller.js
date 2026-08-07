const axios = require("axios").default;
const OrderModel = require("../models/order.model");

async function createOrder(req, res) {
  const user = req.user;

  const token =
    req.cookies?.token ||
    req.headers?.authorization?.split(" ")[1];

  try {
    const { shippingAddress } = req.body || {};

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required to place an order.",
      });
    }

    // Fetch cart from Cart Service
    const cartResponse = await axios.get(
      "http://localhost:3002/api/cart",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const cartItems = cartResponse.data?.cart?.items || [];

    
    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot create order with an empty cart.",
      });
    }

    // Fetch product details from Product Service
    const productsResponses = await Promise.all(
      cartItems.map((item) =>
        axios.get(
          `http://localhost:3001/api/products/${item.productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      )
    );

    let finalPrice = 0;

    // Match cart items with product details and calculate total price
    const orderItems = cartItems.map((item) => {
      const productResponse = productsResponses.find(
        (p) =>
          String(p.data.product._id) === String(item.productId)
      );

    //   if product is not found or stock is less than the quantity in cart then do not create order and return error message
    if(!productResponse || !productResponse.data?.product || productResponse.data.product.stock < item.quantity) {
        throw new Error(
          `Product with ID ${item.productId} is unavailable or out of stock.`
        );
      }

      if (!productResponse || !productResponse.data?.product) {
        throw new Error(
          `Product with ID ${item.productId} is unavailable.`
        );
      }

      const product = productResponse.data.product;

      const unitPrice = Number(product.price.amount);
      const itemTotalPrice = unitPrice * item.quantity;

      finalPrice += itemTotalPrice;

      return {
        product: String(item.productId),
        seller: String(product.seller),
        quantity: Number(item.quantity),
        price: {
          amount: unitPrice,
          currency: product.price.currency || "INR",
        },
      };
    });

     await Promise.all(
  orderItems.map((item) =>
    axios.patch(
      `http://localhost:3001/api/products/${item.product}/decrease-stock`,
      {
        quantity: item.quantity,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
  )
);

    // Create the order in the database
    const newOrder = await OrderModel.create({
      user: String(user.id),
      items: orderItems,
      totalPrice: {
        amount: finalPrice,
        currency: "INR",
      },
      shippingAddress,
      status: "PENDING",
    });
   

    // Clear cart after successful order creation
    try {
      await axios.delete("http://localhost:3002/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (cartError) {
      console.error(
        "Cart clear failed:",
        cartError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order: newOrder,
    });
  } catch (err) {
    console.error("Create Order Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
async function getMyOrders(req, res) {
  try {
    const user = req.user;
    const { page = 1, limit = 10 } = req.query;

    const numericPage = Math.max(Number(page) || 1, 1);
    const numericLimit = Math.max(Number(limit) || 10, 1);
    const safeLimit = Math.min(numericLimit, 20);

    const skip = (numericPage - 1) * safeLimit;

    const filter = {
      user: String(user.id),
    };

    const [orders, totalOrders] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean()
        .exec(),

      OrderModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalOrders / safeLimit) || 1;

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully.",
      pagination: {
        totalOrders,
        totalPages,
        currentPage: numericPage,
        pageSize: safeLimit,
        count: orders.length,
      },
      orders,
    });
  } catch (err) {
    console.error("Get My Orders Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}
module.exports = {
  createOrder,
  getMyOrders
};