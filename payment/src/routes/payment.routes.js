const express = require('express');
const {createAuthMiddleware} = require('../middlewares/auth.middleware')
const paymentController = require('../controllers/payment.controller')
const router = express.Router();

router.post('/:orderId',createAuthMiddleware(['buyer']),paymentController.createPayment)

module.exports = router;