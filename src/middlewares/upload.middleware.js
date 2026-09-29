/**
 * upload.middleware.js - Multer image uploads (doctors, departments, avatars).
 * SCALABILITY NOTE: swap diskStorage for S3/Cloudinary in production; the
 * rest of the app only uses the resulting file path.
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const uploader = (subfolder) => {
  const dest = path.join(process.cwd(), env.UPLOAD_DIR, subfolder);
  fs.mkdirSync(dest, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dest),
      filename: (req, file, cb) =>
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
    }),
    fileFilter: (req, file, cb) =>
      ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`)),
    limits: { fileSize: env.MAX_FILE_UPLOAD_MB * 1024 * 1024 },
  });
};

module.exports = {
  uploadDoctorImage: uploader('doctors').single('image'),
  uploadDepartmentImage: uploader('departments').single('image'),
  uploadAvatar: uploader('avatars').single('avatar'),
};
