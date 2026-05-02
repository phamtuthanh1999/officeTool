const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../../config/database');
const AppError = require('../../utils/AppError');
const env = require('../../config/env');

// ── Google OAuth2 Client ───────────────────────────────────────────────────────
const googleClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_CALLBACK_URL,
);

// ── Helper ─────────────────────────────────────────────────────────────────────
function generateTokens(userId, role) {
  const accessToken = jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
}

/**
 * Register a new user.
 * Returns { accessToken, refreshToken }.
 */
async function register(name, email, password) {
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    throw new AppError('Email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash],
  );

  return generateTokens(result.insertId, 'user');
}

/**
 * Authenticate an existing user.
 * Returns { accessToken, refreshToken }.
 */
async function login(email, password) {
  const [rows] = await pool.query(
    'SELECT id, password_hash, role, is_active FROM users WHERE email = ?',
    [email],
  );

  if (rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = rows[0];

  if (!user.is_active) {
    throw new AppError('Your account has been deactivated', 403);
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  return generateTokens(user.id, user.role);
}

// ── Google OAuth2 ──────────────────────────────────────────────────────────────

/**
 * Tạo URL để redirect user đến trang đăng nhập Google.
 */
function getGoogleAuthUrl() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new AppError('Google OAuth chưa được cấu hình. Vui lòng thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào .env.', 500);
  }

  return googleClient.generateAuthUrl({
    access_type: 'offline',
    // Thêm drive.file để upload file lên Drive của user
    scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.file'],
    prompt: 'consent select_account',
  });
}

/**
 * Xử lý callback từ Google sau khi user xác nhận.
 * 1. Đổi `code` lấy tokens từ Google
 * 2. Verify id_token để lấy thông tin user
 * 3. Upsert user vào DB (tạo mới nếu chưa có)
 * 4. Trả về JWT của hệ thống + thông tin user
 *
 * @param {string} code - Authorization code từ query string callback
 * @returns {{ tokens, user }}
 */
async function handleGoogleCallback(code) {
  if (!code) {
    throw new AppError('Không nhận được authorization code từ Google.', 400);
  }

  // Đổi code lấy tokens
  let googleTokens;
  try {
    const { tokens } = await googleClient.getToken(code);
    googleTokens = tokens;
  } catch (err) {
    throw new AppError('Không thể xác thực với Google. Vui lòng thử lại.', 401);
  }

  // Verify id_token để lấy thông tin user
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: googleTokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw new AppError('Token Google không hợp lệ.', 401);
  }

  const {
    sub: googleId,
    email,
    name,
    picture: avatar,
  } = payload;

  if (!email) {
    throw new AppError('Không lấy được email từ tài khoản Google.', 400);
  }

  // Upsert user: tìm theo google_id hoặc email, tạo mới nếu chưa có
  const [rows] = await pool.query(
    'SELECT id, role FROM users WHERE google_id = ? OR email = ?',
    [googleId, email],
  );

  let userId;
  let userRole;

  if (rows.length > 0) {
    // User đã tồn tại → cập nhật thông tin Google
    userId = rows[0].id;
    userRole = rows[0].role;
    await pool.query(
      'UPDATE users SET google_id = ?, name = ?, avatar = ? WHERE id = ?',
      [googleId, name, avatar, userId],
    );
  } else {
    // User mới → tạo tài khoản
    const [result] = await pool.query(
      'INSERT INTO users (name, email, google_id, avatar, password_hash) VALUES (?, ?, ?, ?, NULL)',
      [name, email, googleId, avatar],
    );
    userId = result.insertId;
    userRole = 'user';
  }

  const tokens = generateTokens(userId, userRole);
  return {
    tokens,
    // Google access token để client dùng cho Drive API
    googleAccessToken: googleTokens.access_token,
    user: {
      email,
      name,
      avatar,
    },
  };
}

module.exports = {
  register, login, getGoogleAuthUrl, handleGoogleCallback,
};
