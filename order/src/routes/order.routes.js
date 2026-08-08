const express = require('express')
const router = express.Router();

const orderController = require('../controllers/order.controller');
const {createAuthMiddleware} = require('../middlewares/auth.middleware')
const {createOrderValidation} = require('../validators/order.validator')
const {updateAddressValidation} = require('../validators/updateAddress.validator')

// POST/api/orders/
router.post('/',createAuthMiddleware(['buyer']),createOrderValidation,orderController.createOrder);
// GET/api/orders/me
router.get('/me',createAuthMiddleware(['buyer']),orderController.getMyOrders);
// GET/api/orders/:id
router.get('/:id',createAuthMiddleware(['buyer','seller','admin']),orderController.getOrderById);
// PATCH/api/orders/:id/cancel
router.post('/:id/cancel',createAuthMiddleware(['buyer']),orderController.cancelOrder);
// PATCH/api/orders/:id/updateAddress
router.patch('/:id/updateAddress',createAuthMiddleware(['buyer']),updateAddressValidation,orderController.updateShippingAddress);

module.exports = router;