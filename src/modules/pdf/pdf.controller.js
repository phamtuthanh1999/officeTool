const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { convertImagesToPdf } = require('./pdf.service');
const { signPdf } = require('./pdf.sign.service');
const { validateSignParams } = require('./pdf.sign.validator');

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

/**
 * POST /api/v1/pdf/sign
 *
 * Nhận 1 file PDF + 1 ảnh PNG chữ ký, nhúng chữ ký vào PDF.
 * Body (multipart/form-data):
 *   - pdf           : file PDF (max 50MB)
 *   - signature     : file PNG/JPG chữ ký (max 5MB)
 *   - page          : 'all' | 'first' | 'last' | số trang 1-based (default: 'last')
 *   - position      : 'bottom-right'|'bottom-left'|'bottom-center'|'top-right'|'top-left'|'center'|'custom'
 *   - sigWidth      : chiều rộng chữ ký trên trang (px, 20–600, default: 160)
 *   - xPct, yPct    : 0–1 (chỉ khi position='custom')
 */
const signPdfHandler = catchAsync(async (req, res) => {
  const pdfFile = req.files?.pdf?.[0];
  const sigFile = req.files?.signature?.[0];

  if (!pdfFile) throw new AppError('Vui lòng upload file PDF (field "pdf").', 400);
  if (!sigFile) throw new AppError('Vui lòng upload ảnh chữ ký (field "signature").', 400);

  if (pdfFile.size > 50 * 1024 * 1024) throw new AppError('File PDF tối đa 50MB.', 400);
  if (sigFile.size > 5 * 1024 * 1024) throw new AppError('Ảnh chữ ký tối đa 5MB.', 400);

  const params = validateSignParams(req.body);

  const signedBuffer = await signPdf(pdfFile.buffer, sigFile.buffer, {
    ...params,
    anchorFromTop: params.anchorFromTop ?? false,
  });

  const originalName = (pdfFile.originalname || 'document').replace(/\.pdf$/i, '');
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${originalName}-signed.pdf"`,
    'Content-Length': signedBuffer.length,
  });
  res.status(200).send(signedBuffer);
});

module.exports = { imagesToPdf, signPdfHandler };
