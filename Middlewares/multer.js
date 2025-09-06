// Middlewares/multerImages.js
import multer from "multer";

const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => cb(null, allowed.includes(file.mimetype)),
});

export default uploadImages;
