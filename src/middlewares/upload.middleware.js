const multer = require('multer');
const AppError = require('../utils/AppError');

// Lưu file vào bộ nhớ RAM thay vì disk để dễ xử lý và forward sang API bên ngoài
const storage = multer.memoryStorage();

/**
 * Kiểm tra MIME type - chỉ cho phép jpg/png
 */
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Định dạng file không hợp lệ. Chỉ chấp nhận JPG hoặc PNG.', 400), false);
  }
};

/**
 * Multer instance cho upload ảnh
 * - Giới hạn 5MB
 * - Chỉ chấp nhận jpg/png
 */
const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: imageFileFilter,
});

/**
 * Xử lý lỗi chung từ multer
 */
const handleMulterError = (err, next) => {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return next(new AppError('Kích thước file quá lớn. Tối đa 5MB mỗi ảnh.', 400));
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return next(new AppError('Quá nhiều file. Tối đa 20 ảnh mỗi lần.', 400));
  }
  if (err instanceof multer.MulterError) {
    return next(new AppError(`Lỗi upload file: ${err.message}`, 400));
  }
  return next(err);
};

/**
 * Middleware upload 1 ảnh (field "image")
 */
const uploadSingleImage = (req, res, next) => {
  uploadImage.single('image')(req, res, (err) => handleMulterError(err, next));
};

/**
 * Middleware upload nhiều ảnh (field "images", tối đa 20 file)
 */
const uploadMultipleImages = (req, res, next) => {
  uploadImage.array('images', 20)(req, res, (err) => handleMulterError(err, next));
};

module.exports = { uploadSingleImage, uploadMultipleImages };
