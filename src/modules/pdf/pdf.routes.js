const { Router } = require('express');
const pdfController = require('./pdf.controller');
const { uploadMultipleImages, uploadPdfSignFields } = require('../../middlewares/upload.middleware');
const { protect } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: PDF
 *     description: Chuyển đổi ảnh sang PDF
 */

/**
 * @openapi
 * /api/v1/pdf/images-to-pdf:
 *   post:
 *     tags: [PDF]
 *     summary: Chuyển nhiều ảnh thành 1 file PDF
 *     description: >
 *       Nhận 1–20 ảnh JPG/PNG (mỗi ảnh tối đa 5MB).
 *       Mỗi ảnh sẽ là 1 trang A4, giữ tỉ lệ, canh giữa.
 *       Trả về file PDF sẵn sàng tải xuống.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Danh sách ảnh JPG/PNG (tối đa 20 file, mỗi file ≤5MB)
 *           encoding:
 *             images:
 *               contentType: image/jpeg, image/png
 *     responses:
 *       200:
 *         description: File PDF chứa các ảnh
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: File không hợp lệ hoặc thiếu file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: fail }
 *                 message:
 *                   type: string
 *                   example: Vui lòng gửi ít nhất 1 file ảnh.
 *       500:
 *         description: Lỗi khi tạo PDF
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: error }
 *                 message: { type: string, example: Lỗi khi tạo PDF. }
 */
router.post('/images-to-pdf', uploadMultipleImages, pdfController.imagesToPdf);

/**
 * @openapi
 * /api/v1/pdf/sign:
 *   post:
 *     tags: [PDF]
 *     summary: Ký số PDF (nhúng ảnh chữ ký vào trang PDF)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [pdf, signature]
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *               signature:
 *                 type: string
 *                 format: binary
 *               page:
 *                 type: string
 *                 default: last
 *               position:
 *                 type: string
 *                 default: bottom-right
 *               sigWidth:
 *                 type: integer
 *                 default: 160
 *     responses:
 *       200:
 *         description: File PDF đã ký
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/sign', protect, uploadPdfSignFields, pdfController.signPdfHandler);

module.exports = router;
