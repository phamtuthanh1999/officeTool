const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { convertFiles } = require('./convert.service');

/**
 * POST /api/v1/convert
 *
 * Body: multipart/form-data
 *   files[]      — 1..10 file cần chuyển đổi
 *   targetFormat — định dạng đầu ra (PDF, PNG, JPG, WEBP, BMP, TIFF, GIF)
 *
 * Response: binary file hoặc ZIP nếu nhiều file ảnh → ảnh
 */
const convert = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError('Vui lòng gửi ít nhất 1 file với field name là "files".', 400);
  }

  const targetFormat = (req.body.targetFormat || '').trim();
  if (!targetFormat) {
    throw new AppError('Vui lòng truyền trường "targetFormat" (ví dụ: PDF, PNG, WEBP).', 400);
  }

  const { buffer, mime, filename } = await convertFiles(req.files, targetFormat);

  // Encode filename để tránh lỗi với ký tự đặc biệt
  const safeFilename = encodeURIComponent(filename).replace(/%20/g, '_');

  res.set({
    'Content-Type': mime,
    'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
    'Content-Length': buffer.length,
  });
  res.status(200).send(buffer);
});

module.exports = { convert };
