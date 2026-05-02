const mysql = require('mysql2/promise');
const logger = require('./logger');
const env = require('./env');
const cluster = require('cluster');

/**
 * MySQL connection pool — reuse connections instead of creating new ones per request.
 * connectionLimit controls concurrency; tune via DB_CONNECTION_LIMIT env var.
 */
// Compute effective per-worker connection limit.
// Priority: explicit per-worker env -> total limit divided by workers -> legacy DB_CONNECTION_LIMIT
const totalWorkers = Math.max(1, parseInt(process.env.NUM_WORKERS || '1', 10));
let effectiveConnLimit;
if (env.DB_CONNECTION_LIMIT_PER_WORKER) {
  effectiveConnLimit = Number(env.DB_CONNECTION_LIMIT_PER_WORKER);
} else if (env.DB_TOTAL_CONNECTION_LIMIT) {
  effectiveConnLimit = Math.max(1, Math.floor(Number(env.DB_TOTAL_CONNECTION_LIMIT) / totalWorkers));
} else {
  effectiveConnLimit = Number(env.DB_CONNECTION_LIMIT);
}

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: effectiveConnLimit,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00',
  charset: 'utf8mb4',
});

/**
 * Test connectivity at startup.
 * Retries every 5 s up to maxRetries times so the server stays alive while
 * MySQL is starting up. Only exits after all retries are exhausted.
 */
async function testConnection(retries = 5, delayMs = 5000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    let connection;
    try {
      // eslint-disable-next-line no-await-in-loop
      connection = await pool.getConnection();
      const workerInfo = cluster && cluster.isWorker ? `worker=${cluster.worker.id} ` : '';
      logger.info(`Database connection pool initialised successfully (${workerInfo}pid=${process.pid})`);
      return;
    } catch (err) {
      logger.warn(
        `DB connection attempt ${attempt}/${retries} failed: ${err.message}${attempt < retries ? ` — retrying in ${delayMs / 1000}s...` : ''}`,
      );
    } finally {
      if (connection) connection.release();
    }
    if (attempt < retries) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { setTimeout(resolve, delayMs); });
    }
  }
  logger.error('Could not connect to database after all retries. Check DB_HOST/DB_PORT/DB_USER/DB_PASSWORD in .env');
}

testConnection();

// ── Query logger ──────────────────────────────────────────────────────────────
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

const originalQuery = pool.query.bind(pool);
pool.query = function loggedQuery(sql, params) {
  const start = Date.now();
  const stmt = (typeof sql === 'string' ? sql : String(sql)).replace(/\s+/g, ' ').trim();
  const p = params && params.length ? JSON.stringify(params) : '[]';
  return originalQuery(sql, params).then((result) => {
    const ms = Date.now() - start;
    process.stdout.write(`${CYAN}[DB ${ms}ms]${RESET} ${stmt}\n`);
    process.stdout.write(`${GRAY}        params: ${p}${RESET}\n`);
    return result;
  }).catch((err) => {
    const ms = Date.now() - start;
    process.stdout.write(`${RED}[DB ERR ${ms}ms]${RESET} ${stmt}\n`);
    process.stdout.write(`${GRAY}        params: ${p}${RESET}\n`);
    process.stdout.write(`${RED}        error: [${err.code}] ${err.message}${RESET}\n`);
    throw err;
  });
};

module.exports = pool;
