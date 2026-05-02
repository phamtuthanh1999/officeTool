const { Router } = require('express');
const { imagesToDrive } = require('./drive.controller');

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Drive
 *     description: Upload file lên Google Drive
 */

/**
 * @openapi
 * /api/v1/drive/images-to-pdf:
 *   post:
 *     tags: [Drive]
 *     summary: Convert ảnh → PDF và lưu vào Google Drive
 *     description: >
 *       Nhận 1–20 ảnh JPG/PNG, convert thành 1 file PDF,
 *       upload lên Google Drive của user và trả về link file.
 *       Yêu cầu Google access token (lấy từ response của /auth/google/callback)
 *       trong header `X-Google-Token`.
 *     parameters:
 *       - in: header
 *         name: X-Google-Token
 *         required: true
 *         schema: { type: string }
 *         description: Google access token nhận được sau khi đăng nhập Google
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
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     file:
 *                       type: object
 *                       properties:
 *                         name: { type: string, example: images-1234567890.pdf }
 *                         fileId: { type: string, example: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs }
 *                         driveLink:
 *                           type: string
 *                           example: https://drive.google.com/file/d/xxx/view
 *       400:
 *         description: File không hợp lệ hoặc thiếu file
 *       401:
 *         description: Thiếu hoặc hết hạn Google access token
 *       403:
 *         description: Chưa cấp quyền Google Drive
 */
router.post('/images-to-pdf', imagesToDrive);

module.exports = router;
