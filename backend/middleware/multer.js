
import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  const error = new Error(
    "Only JPEG, PNG, WebP, GIF, and AVIF images are allowed."
  );
  error.statusCode = 400;

  return cb(error);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
  fileFilter,
});

export default upload;
