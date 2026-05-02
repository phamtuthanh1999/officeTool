const authService = require('./auth.service');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/response');

const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const tokens = await authService.register(name, email, password);
  sendSuccess(res, 201, { tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const tokens = await authService.login(email, password);
  sendSuccess(res, 200, { tokens });
});

// ── Google OAuth2 ──────────────────────────────────────────────────────────────

/**
 * GET /api/v1/auth/google
 * Redirect user đến trang đăng nhập Google.
 */
const googleLogin = catchAsync(async (req, res) => {
  const url = authService.getGoogleAuthUrl();
  res.redirect(url);
});

/**
 * GET /api/v1/auth/google/callback
 * Google redirect về đây sau khi user xác nhận.
 * Trả về JWT + thông tin user.
 */
const googleCallback = catchAsync(async (req, res) => {
  const { code, error } = req.query;
  const env = require('../../config/env');
  const frontendUrl = (env.FRONTEND_URL || 'http://localhost:3001').replace(/\/+$/, '');

  // User bấm "Cancel" trên trang Google
  if (error) {
    return res.redirect(`${frontendUrl}/login?error=google_cancelled`);
  }

  const { tokens, googleAccessToken, user } = await authService.handleGoogleCallback(code);

  const params = new URLSearchParams({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    ...(googleAccessToken ? { googleAccessToken } : {}),
  });
  return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
});

module.exports = {
  register, login, googleLogin, googleCallback,
};
