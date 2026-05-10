require('dotenv').config();

const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  // Hard cap to prevent runaway worker spawn — low for shared hosting (50 process quota)
  MAX_WORKERS_CAP: Joi.number().default(2),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  // Shared hosting MySQL usually caps connections per user; keep pool small.
  DB_CONNECTION_LIMIT: Joi.number().default(5),
  // Process / worker safety — default to cPanel hosting quota
  PROCESS_LIMIT: Joi.number().default(50),
  RESERVED_PROCESS_SLOTS: Joi.number().default(5),
  // Worker restart/backoff tuning
  WORKER_RESTART_WINDOW_MS: Joi.number().default(60 * 1000),
  WORKER_MAX_RESTARTS: Joi.number().default(5),
  WORKER_RESTART_BACKOFF_MS: Joi.number().default(2000),
  // Optional: explicitly set a per-worker DB connection limit
  DB_CONNECTION_LIMIT_PER_WORKER: Joi.number().optional(),
  // Optional: total DB connection limit across all workers. If set,
  // each worker will get Math.floor(DB_TOTAL_CONNECTION_LIMIT / NUM_WORKERS)
  DB_TOTAL_CONNECTION_LIMIT: Joi.number().optional(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: Joi.number().default(100),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),
  // Disable clustering (run single-process). Useful on shared hosts like cPanel.
  DISABLE_CLUSTER: Joi.boolean().truthy('1').truthy('true').falsy('0').falsy('false').default(true),
  // Public API base URL used in generated swagger spec (optional)
  API_BASE_URL: Joi.string().uri().optional().allow(''),
  // Google OAuth2
  GOOGLE_CLIENT_ID: Joi.string().optional().allow(''),
  GOOGLE_CLIENT_SECRET: Joi.string().optional().allow(''),
  GOOGLE_CALLBACK_URL: Joi.string().uri().optional().allow(''),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3001'),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = envVars;
