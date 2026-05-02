const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { convertImagesToPdf } = require('./pdf.service');

/**
 * POST /api/v1/pdf/images-to-pdf
 *
 * Nhận 1..20 ảnh JPG/PNG, chuyển thành 1 file PDF (mỗi ảnh 1 trang).
 */
const imagesToPdf = catchAsync(async (req, res) => {
  // Bước 1: Kiểm tra có file không
  if (!req.files || req.files.length === 0) {
    throw new AppError('Vui lòng gửi ít nhất 1 file ảnh với field name là "images".', 400);
  }

  // Bước 2: Validate từng file (multer đã kiểm tra định dạng & kích thước)
  // Double-check kích thước
  const oversized = req.files.find((f) => f.size > 5 * 1024 * 1024);
  if (oversized) {
    throw new AppError(`File "${oversized.originalname}" vượt quá 5MB.`, 400);
  }

  // Bước 3: Chuyển đổi ảnh → PDF
  const pdfBuffer = await convertImagesToPdf(req.files);

  // Bước 4: Trả về file PDF
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="images.pdf"',
    'Content-Length': pdfBuffer.length,
  });
  res.status(200).send(pdfBuffer);
});

module.exports = { imagesToPdf };
