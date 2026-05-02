const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { convertImagesToPdf } = require('../pdf/pdf.service');
const { uploadToDrive } = require('./drive.service');
const { uploadMultipleImages } = require('../../middlewares/upload.middleware');

/**
 * POST /api/v1/drive/images-to-pdf
 *
 * Luồng:
 *  1. Nhận nhiều ảnh (field "images") + Google access token (header X-Google-Token)
 *  2. Validate ảnh
 *  3. Xóa nền từng ảnh (song song)
 *  4. Convert ảnh đã xóa nền → PDF
 *  5. Upload PDF vào folder "Removed Background PDFs" trên Google Drive
 *  6. Trả về link file và link folder
 */
const imagesToDrive = [
  uploadMultipleImages,

  catchAsync(async (req, res) => {
    const googleAccessToken = req.headers['x-google-token'];
    if (!googleAccessToken) {
      throw new AppError('Vui lòng gửi Google access token trong header X-Google-Token.', 401);
    }

    if (!req.files || req.files.length === 0) {
      throw new AppError('Vui lòng gửi ít nhất 1 file ảnh với field name là "images".', 400);
    }

    const oversized = req.files.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      throw new AppError(`File "${oversized.originalname}" vượt quá 5MB.`, 400);
    }

    // Bước 3: (Background removal feature removed) — use original uploaded buffers
    const removedBuffers = req.files.map((f) => f.buffer);

    // Bước 4: Convert các ảnh đã xóa nền → PDF
    // Tạo objects giả để tương thích với convertImagesToPdf (cần { buffer })
    const pdfBuffer = await convertImagesToPdf(
      removedBuffers.map((buf) => ({ buffer: buf })),
    );

    // Bước 5: Upload PDF vào folder trên Drive
    const fileName = `removed-bg-${Date.now()}.pdf`;
    const {
      fileId, driveLink, folderName, folderLink,
    } = await uploadToDrive(googleAccessToken, pdfBuffer, fileName, 'application/pdf');

    // Bước 6: Trả kết quả
    res.status(200).json({
      status: 'success',
      data: {
        file: {
          name: fileName,
          fileId,
          driveLink,
        },
        folder: {
          name: folderName,
          folderLink,
        },
      },
    });
  }),
];

module.exports = { imagesToDrive };
