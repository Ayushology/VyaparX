const { body, validationResult } = require("express-validator");

const validateUpdateProduct = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage("Title must be between 3 and 120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("currency")
    .optional()
    .isIn(["INR", "USD"])
    .withMessage("Currency must be either INR or USD"),

  body("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category cannot be empty"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("images")
    .optional()
    .custom((value) => {
      if (typeof value === "string") return true;

      if (
        Array.isArray(value) &&
        value.every((img) => typeof img === "string")
      ) {
        return true;
      }

      throw new Error(
        "Images must be a string or an array of strings"
      );
    }),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    next();
  },
];

module.exports = {
  validateUpdateProduct,
};