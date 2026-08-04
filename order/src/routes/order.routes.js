const express = require('express')

const router = express.Router();
const orderController = require('../controllers/order.controller');
const {createAuthMiddleware} = require('../middlewares/auth.middleware')


router.post('/',createAuthMiddleware(['buyer']),orderController.createOrder);


module.exports = router;    