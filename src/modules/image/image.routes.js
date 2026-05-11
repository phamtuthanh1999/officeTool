const { Router } = require('express');
const { resize } = require('./image.controller');
const { uploadSingleImageLarge } = require('../../middlewares/upload.middleware');
const { protect } = require('../../middlewares/auth.middleware');

const router = Router();

/**
 * @swagger
 * /image/resize:
 *   post:
 *     summary: Thay đổi kích thước ảnh
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh JPG/PNG/WebP (tối đa 10MB)
 *               width:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 8000
 *               height:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 8000
 *               format:
 *                 type: string
 *                 enum: [jpeg, png, webp]
 *                 default: jpeg
 *               fit:
 *                 type: string
 *                 enum: [cover, contain, fill, inside, outside]
 *                 default: inside
 *               quality:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 100
 *                 default: 90
 *     responses:
 *       200:
 *         description: File ảnh đã resize
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/resize', protect, uploadSingleImageLarge, resize);

module.exports = router;
