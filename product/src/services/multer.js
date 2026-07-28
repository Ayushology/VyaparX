const multer = require("multer");

const storage = multer.memoryStorage();
const limits = {
  fileSize: 5 * 1024 * 1024,
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const isValidType = allowedTypes.test(file.mimetype);

  if (isValidType) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({ storage, limits, fileFilter });

module.exports = upload;
