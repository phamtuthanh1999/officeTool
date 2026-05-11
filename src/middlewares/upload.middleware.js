const multer = require('multer');
const AppError = require('../utils/AppError');

// Lưu file vào bộ nhớ RAM thay vì disk để dễ xử lý và forward sang API bên ngoài
const storage = multer.memoryStorage();

/**
 * Kiểm tra MIME type - chỉ cho phép jpg/png
 */
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Định dạng file không hợp lệ. Chỉ chấp nhận JPG, PNG hoặc WebP.', 400), false);
  }
};

/**
 * Multer instance cho upload ảnh
 * - Giới hạn 5MB
 * - Chỉ chấp nhận jpg/png/webp
 */
const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: imageFileFilter,
});

/**
 * Multer instance cho upload ảnh resize
 * - Giới hạn 10MB
 * - Chỉ chấp nhận jpg/png/webp
 */
const uploadImageLarge = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
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
 * Middleware upload 1 ảnh lớn cho resize (field "image", tối đa 10MB)
 */
const uploadSingleImageLarge = (req, res, next) => {
  uploadImageLarge.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('Kích thước file quá lớn. Tối đa 10MB mỗi ảnh.', 400));
    }
    if (err instanceof multer.MulterError) {
      return next(new AppError(`Lỗi upload file: ${err.message}`, 400));
    }
    return next(err);
  });
};

/**
 * Middleware upload nhiều ảnh (field "images", tối đa 20 file)
 */
const uploadMultipleImages = (req, res, next) => {
  uploadImage.array('images', 20)(req, res, (err) => handleMulterError(err, next));
};

/**
 * Multer instance cho convert — chấp nhận mọi loại file, tối đa 50MB/file
 */
const uploadConvertRaw = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10,
  },
});

const handleConvertMulterError = (err, next) => {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return next(new AppError('Kích thước file quá lớn. Tối đa 50MB mỗi file.', 400));
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return next(new AppError('Quá nhiều file. Tối đa 10 file mỗi lần.', 400));
  }
  if (err instanceof multer.MulterError) {
    return next(new AppError(`Lỗi upload file: ${err.message}`, 400));
  }
  return next(err);
};

/**
 * Middleware upload nhiều file để convert (field "files", tối đa 10 file, 50MB/file)
 */
const uploadConvertFiles = (req, res, next) => {
  uploadConvertRaw.array('files', 10)(req, res, (err) => handleConvertMulterError(err, next));
};

/**
 * Multer instance cho PDF sign — chấp nhận PDF (max 50MB) + ảnh chữ ký (max 5MB)
 */
const pdfSignFileFilter = (req, file, cb) => {
  if (file.fieldname === 'pdf') {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    return cb(new AppError('Field "pdf" chỉ chấp nhận file PDF.', 400), false);
  }
  if (file.fieldname === 'signature') {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new AppError('Field "signature" chỉ chấp nhận JPG, PNG hoặc WebP.', 400), false);
  }
  cb(null, false);
};

const uploadPdfSign = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 2 },
  fileFilter: pdfSignFileFilter,
});

/**
 * Middleware upload PDF sign (fields: pdf + signature)
 */
const uploadPdfSignFields = (req, res, next) => {
  uploadPdfSign.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
  ])(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File PDF tối đa 50MB, ảnh chữ ký tối đa 5MB.', 400));
    }
    if (err instanceof multer.MulterError) {
      return next(new AppError(`Lỗi upload: ${err.message}`, 400));
    }
    return next(err);
  });
};

module.exports = { uploadSingleImage, uploadSingleImageLarge, uploadMultipleImages, uploadConvertFiles, uploadPdfSignFields };
