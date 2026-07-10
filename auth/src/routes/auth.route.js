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


module.exports = router;
