const express = require('express')

const router = express.Router();
const orderController = require('../controllers/order.controller');
const {createAuthMiddleware} = require('./auth.middleware')


router.post('/',createAuthMiddleware(['buyer']),orderController.createOrder);

router.get('/me',createAuthMiddleware(['buyer']),orderController.getMyOrders)

router
module.exports = router;