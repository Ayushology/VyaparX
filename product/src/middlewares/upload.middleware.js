const upload = require("../services/multer");

const uploadProductImages = (req, res, next) => {
  upload.array("images", 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed.",
      });
    }
    next();
  });
};

module.exports = { uploadProductImages };