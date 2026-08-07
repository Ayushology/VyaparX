const express = require('express')

const router = express.Router();
const orderController = require('../controllers/order.controller');
const {createAuthMiddleware} = require('../middlewares/auth.middleware')
const {createOrderValidation} = require('../validators/order.validator')
const {updateAddressValidation} = require('../validators/updateAddress.validator')
router.post('/',createAuthMiddleware(['buyer']),createOrderValidation,orderController.createOrder);

router.get('/me',createAuthMiddleware(['buyer']),orderController.getMyOrders);

router.get('/:id',createAuthMiddleware(['buyer','seller','admin']),orderController.getOrderById);

router.post('/:id/cancel',createAuthMiddleware(['buyer']),orderController.cancelOrder);

router.patch('/:id/updateAddress',createAuthMiddleware(['buyer']),updateAddressValidation,orderController.updateShippingAddress);
module.exports = router;