const express = require('express');
const {createAuthMiddleware} = require('../middlewares/auth.middleware')
const paymentController = require('../controllers/payment.controller')
const router = express.Router();

// POST api/payments/verify
router.post('/verify',createAuthMiddleware(['buyer']),paymentController.verifyPayment)
// POST api/payments/:orderId
router.post('/:orderId',createAuthMiddleware(['buyer']),paymentController.createPayment)

module.exports = router;