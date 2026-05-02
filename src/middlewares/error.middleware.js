const logger = require('../config/logger');
const AppError = require('../utils/AppError');
const env = require('../config/env');

// --- Error transformers ---

function handleDBError(err) {
  if (err.code === 'ER_DUP_ENTRY') {
    const field = err.message.match(/key '(.+?)'/)?.[1] || 'field';
    return new AppError(`Duplicate value for ${field}`, 409);
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return new AppError('Referenced resource not found', 400);
  }
  if (err.code === 'ER_PARSE_ERROR' || err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
    return new AppError('Database query error', 500);
  }
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return new AppError('Database connection lost', 503);
  }
  return null;
}

function handleJWTError() {
  return new AppError('Invalid token. Please log in again.', 401);
}

function handleJWTExpiredError() {
  return new AppError('Token has expired. Please log in again.', 401);
}

// --- Centralized error handler ---

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // Transform known error types into operational AppErrors
  if (err.code && err.code.startsWith('ER_')) error = handleDBError(err) || err;
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  // Log server errors with full detail
  if (error.statusCode >= 500) {
    logger.error({
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  }

  // In production, hide details of non-operational errors
  if (env.NODE_ENV === 'production' && !error.isOperational) {
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }

  return res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    ...(env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
}

// --- 404 handler ---

function notFound(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}

module.exports = { errorHandler, notFound };
