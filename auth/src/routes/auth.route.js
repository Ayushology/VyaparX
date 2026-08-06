const express = require("express");
const router = express.Router();
const validators = require('../validators/auth.validator')
const authController = require('../controllers/auth.controller')
const authMiddleware = require('../middlewares/auth.middleware')
// REGISTER API 
router.post("/register",validators.registerUserValidations,authController.registerUser);
// LOGIN API
router.post("/login", validators.loginUserValidations, authController.loginUser);
// PROFILE API
router.get('/me',authMiddleware.authMiddleware,authController.getCurrentUser);
// LOGOUT API
router.get('/logout',authMiddleware.authMiddleware,authController.logoutUser);
// ADDRESS CREATE
router.post('/users/me/addresses',validators.createAddressValidations,authMiddleware.authMiddleware,authController.createAddress);
// ADDRESS LIST
router.get('/users/me/addresses',authMiddleware.authMiddleware,authController.getAddress);
// ADDRESS DELETE
router.delete('/users/me/addresses/:addressId',authMiddleware.authMiddleware,authController.deleteAddress); 

module.exports = router;
