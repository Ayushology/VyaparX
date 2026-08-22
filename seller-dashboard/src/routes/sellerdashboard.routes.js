const express = require('express');
const {createAuthMiddleware} = require('../middlewares/auth.middleware');
const controller = require("../controllers/seller.controller")

const router = express.Router();


// /api/seller/dashboard/metrics
router.get("/metrics", createAuthMiddleware([ "seller" ]), controller.getMetrics)
//  /api/seller/dashboard/orders
router.get("/orders", createAuthMiddleware([ "seller" ]), controller.getOrders)
// /api/seller/dashboard/products
router.get("/products", createAuthMiddleware([ "seller" ]), controller.getProducts)
// /api/seller/dashboard/low-stock-alerts
router.get("/low-stock-alerts", createAuthMiddleware([ "seller" ]), controller.getLowStockAlerts)

module.exports = router;