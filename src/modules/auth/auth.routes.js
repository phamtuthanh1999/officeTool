const { Router } = require('express');
const authController = require('./auth.controller');
const { registerSchema, loginSchema, validate } = require('./auth.validator');
const { authRateLimiter } = require('../../middlewares/rateLimiter.middleware');

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Registration and authentication
 */

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       $ref: '#/components/schemas/Tokens'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and obtain JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       $ref: '#/components/schemas/Tokens'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

// ── Google OAuth2 ──────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Bắt đầu đăng nhập bằng Google
 *     description: Redirect người dùng đến trang xác thực Google OAuth2.
 *     responses:
 *       302:
 *         description: Redirect đến Google login page
 */
router.get('/google', authController.googleLogin);

/**
 * @openapi
 * /api/v1/auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback sau khi Google xác thực
 *     description: >
 *       Google redirect về đây với `code`. Server đổi code lấy thông tin user
 *       và trả về JWT cùng thông tin user.
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema: { type: string }
 *         description: Authorization code từ Google
 *       - in: query
 *         name: error
 *         schema: { type: string }
 *         description: Lỗi nếu user hủy đăng nhập
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       $ref: '#/components/schemas/Tokens'
 *                     user:
 *                       type: object
 *                       properties:
 *                         email: { type: string, example: user@gmail.com }
 *                         name: { type: string, example: Nguyen Van A }
 *                         avatar: { type: string, example: 'https://...' }
 *       400:
 *         description: User hủy đăng nhập hoặc code không hợp lệ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Token Google không hợp lệ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/google/callback', authController.googleCallback);

// ── Protected routes ───────────────────────────────────────────────────────────
const { protect } = require('../../middlewares/auth.middleware');

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Lấy thông tin user hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, authController.getMe);

/**
 * @openapi
 * /api/v1/auth/me:
 *   patch:
 *     tags: [Auth]
 *     summary: Cập nhật thông tin user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       409:
 *         description: Email already in use
 */
router.patch('/me', protect, authController.updateMe);

module.exports = router;
