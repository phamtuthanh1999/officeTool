const { Router } = require('express');
const { convert } = require('./convert.controller');
const { uploadConvertFiles } = require('../../middlewares/upload.middleware');

const router = Router();

/**
 * @openapi
 * /api/v1/convert:
 *   post:
 *     tags: [Convert]
 *     summary: Chuyển đổi file sang định dạng khác
 *     description: >
 *       Nhận 1–10 file (tối đa 50MB/file) và chuyển sang định dạng đầu ra.
 *       Hỗ trợ: ảnh → PDF, ảnh → ảnh (PNG/JPG/WEBP/BMP/TIFF/GIF).
 *       Nếu nhiều file ảnh → ảnh, kết quả trả về file ZIP.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files, targetFormat]
 *             properties:
 *               files:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               targetFormat:
 *                 type: string
 *                 example: PDF
 *     responses:
 *       200:
 *         description: File kết quả (PDF, ảnh, hoặc ZIP)
 *         content:
 *           application/pdf: { schema: { type: string, format: binary } }
 *           application/zip: { schema: { type: string, format: binary } }
 *           image/*: { schema: { type: string, format: binary } }
 *       400:
 *         description: Thiếu file hoặc định dạng không hỗ trợ
 */
router.post('/', uploadConvertFiles, convert);

module.exports = router;
