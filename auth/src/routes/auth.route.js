const express = require("express");
const router = express.Router();
const validators = require('../validators/auth.validator')
const authController = require('../controllers/auth.controller')


router.post("/register",validators.registerUserValidations,authController.registerUser);
router.post("/login", validators.loginUserValidations, authController.loginUser);

module.exports = router;
