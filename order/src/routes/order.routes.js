const express = require('express')

const router = express.Router();
const orderController = require('../controllers/order.controller');
const {createAuthMiddleware} = require('./auth.middleware')


router.post('/',createAuthMiddleware(['buyer']),orderController.createOrder);

router.get('/orders/:id',createAuthMiddleware(['buyer']),orderController.getOrderById)

module.exports = router;    