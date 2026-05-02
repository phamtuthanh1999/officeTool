const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const env = require('../config/env');

/**
 * Apply security-related middleware to the Express app.
 * Called once during app initialisation.
 */
function applySecurityMiddleware(app) {
  // Set secure HTTP headers
  app.use(helmet());

  // CORS — configure allowed origins via CORS_ORIGIN env var
  const allowedOrigins = env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // Gzip/Brotli response compression
  app.use(compression());

  // Remove fingerprinting header
  app.disable('x-powered-by');
}

module.exports = { applySecurityMiddleware };
