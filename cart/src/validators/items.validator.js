const {body,validationResult} = require('express-validator')

function validateResult(req, res, next){
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }
    next();
  }

const validateItemToCart = [
   body("productId")
    .trim()
    .notEmpty()
    .withMessage("Product ID is required.")
    .isString()
    .withMessage("Product ID must be a valid string."),
    body("quantity")
    .optional() 
    .toInt()  
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer of at least 1."),
]

module.exports = {validateItemToCart}