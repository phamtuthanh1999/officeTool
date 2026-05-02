const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const env = require('../config/env');

/**
 * Protect routes — verify Bearer JWT token and attach decoded payload to req.user.
 */
const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided. Please log in.', 401));
  }

  const token = authHeader.split(' ')[1];

  // jwt.verify throws JsonWebTokenError / TokenExpiredError — handled centrally
  const decoded = jwt.verify(token, env.JWT_SECRET);

  req.user = { id: decoded.id, role: decoded.role };

  return next();
});

/**
 * Restrict access to specific roles.
 * Usage: router.delete('/:id', protect, restrictTo('admin'), handler)
 */
const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    return next();
  };

module.exports = { protect, restrictTo };
