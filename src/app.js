const express = require('express');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const routes = require('./routes');
const swaggerSpec = require('./config/swagger');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const { applySecurityMiddleware } = require('./middlewares/security.middleware');
const { globalRateLimiter } = require('./middlewares/rateLimiter.middleware');
const logger = require('./config/logger');
const env = require('./config/env');

const app = express();

// ── Security ─────────────────────────────────────────────────────────────────
applySecurityMiddleware(app);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── HTTP request logging ──────────────────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.path === '/health',
  })
);

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
    env: env.NODE_ENV,
  });
});

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'APP_MAIN API Docs',
    swaggerOptions: { persistAuthorization: true },
  })
);

// ── Swagger JSON spec ─────────────────────────────────────────────────────────
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── Error handling ─────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Worker ${process.pid} listening on port ${PORT} [${env.NODE_ENV}]`);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`${signal} received. Closing HTTP server...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting.');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
