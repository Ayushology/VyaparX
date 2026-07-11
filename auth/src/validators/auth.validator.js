const {body,validationResult} = require('express-validator')

const respondWithValidationResult = (req,res,next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors : errors.array({onlyFirstError : true})
        })
    }
    next();
}

const registerUserValidations = [

    body("username")
        .trim()
        .notEmpty() 
        .withMessage("Username is required") 
        .bail()
        .isString()
        .withMessage("It must be a valid string")
        .bail()
        .isLength({min : 3})
        .withMessage("Username must be at least 3 characters long"),

    body("email")
        .trim()
        .notEmpty() 
        .withMessage("Email is required")
        .bail()
        .isEmail ()
        .withMessage("It must be a valid email address"),

    body("password")
        .notEmpty()
        .withMessage("Password field is required")
        .bail()
        .isLength({min : 6})
        .withMessage("Password must be at least 6 characters long"),

    body("fullName.firstName")
        .trim()
        .notEmpty()
        .withMessage("FirstName is required")
        .bail()
        .isString()
        .withMessage("It must be a valid string"),

    body("fullName.lastName")
        .trim()
        .notEmpty()
        .withMessage("LastName is required")
        .bail()
        .isString()
        .withMessage("It must be a valid string"),
        respondWithValidationResult
]

const loginUserValidations = [
  body("username")
    .optional()
    .trim()
    .isString()
    .withMessage("It must be a valid string")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("It must be a valid email address"),

  body("password")
    .notEmpty()
    .withMessage("Password field is required")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body().custom((value, { req }) => {

    const username = req.body.username?.trim(); 
    const email = req.body.email?.trim(); 

    if (!username && !email) {
      throw new Error("Either username or email is required");
    }

    return true;
  }),

  respondWithValidationResult
];

const createAddressValidations = [
  body("street")
    .trim()
    .notEmpty()
    .withMessage("Street is required")
    .bail()
    .isString()
    .withMessage("Street must be a valid string")
    .bail()
    .isLength({ min: 5, max: 100 })
    .withMessage("Street must be between 5 and 100 characters"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .bail()
    .isString()
    .withMessage("City must be a valid string")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),

  body("state")
    .trim()
    .notEmpty()
    .withMessage("State is required")
    .bail()
    .isString()
    .withMessage("State must be a valid string")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters"),

  body("zip")
    .trim()
    .notEmpty()
    .withMessage("ZIP code is required")
    .bail()
    .matches(/^\d{6}$/)
    .withMessage("ZIP code must be a valid 6-digit Indian PIN code"),

  body("country")
    .trim()
    .notEmpty()
    .withMessage("Country is required")
    .bail()
    .isString()
    .withMessage("Country must be a valid string")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),

  respondWithValidationResult,
];
module.exports = {registerUserValidations, loginUserValidations,createAddressValidations}