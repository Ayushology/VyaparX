const { body, validationResult } = require("express-validator");

const ALLOWED_CURRENCIES = ["INR", "USD"];

const validateCreateProduct = [
  

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .bail()
    .isLength({ min: 3, max: 120 })
    .withMessage("Title must be between 3 and 120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .bail()
    .isFloat({ gt: 0, max: 1000000 })
    .withMessage("Price must be between 0 and 1,000,000")
    .toFloat(),

  body("currency")
    .optional()
    .trim()
    .toUpperCase()
    .isIn(ALLOWED_CURRENCIES)
    .withMessage(`Currency must be one of: ${ALLOWED_CURRENCIES.join(", ")}`),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .bail()
    .isLength({ min: 2, max: 80 })
    .withMessage("Category must be between 2 and 80 characters"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer")
    .toInt(),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array({ onlyFirstError: true }).map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }

    next();
  },
];

module.exports = { validateCreateProduct };