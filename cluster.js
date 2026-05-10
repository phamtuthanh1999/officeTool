/**
 * Cluster entry point.
 *
 * In production, spawns one worker per CPU core so Node.js can fully utilise
 * all available cores. The master process monitors workers and restarts any
 * that exit unexpectedly.
 *
 * In development, just run: node src/app.js   (or use nodemon)
 */

const cluster = require('cluster');
const os = require('os');

// Logger may reference env vars, so bootstrap env first
const env = require('./src/config/env');
const logger = require('./src/config/logger');


const detectedCPUs = os.cpus().length;
// Allow runtime override with MAX_WORKERS env var. Default to a safe cap.
// Shared hosting: keep workers low to stay within process quota (50 total / 20 entry).
const DEFAULT_MAX_WORKERS = 2;
const maxWorkersEnv = parseInt(process.env.MAX_WORKERS || '', 10);
// Hard cap to avoid runaway forks (can be overridden with MAX_WORKERS_CAP or MAX_WORKERS_HARD)
const hardCapEnv = parseInt(process.env.MAX_WORKERS_CAP || process.env.MAX_WORKERS_HARD || '', 10);
const DEFAULT_HARD_CAP = 4;
let numCPUs;
if (Number.isFinite(maxWorkersEnv) && maxWorkersEnv > 0) {
  numCPUs = Math.min(detectedCPUs, maxWorkersEnv);
} else {
  numCPUs = Math.min(detectedCPUs, DEFAULT_MAX_WORKERS);
}
const hardCap = Number.isFinite(hardCapEnv) && hardCapEnv > 0 ? hardCapEnv : DEFAULT_HARD_CAP;

// Respect a process-level limit if provided (e.g., cPanel total process quota).
// Default PROCESS_LIMIT to 50 to match shared hosting quota.
const processLimitEnv = parseInt(process.env.PROCESS_LIMIT || '50', 10);
const reservedSlots = parseInt(process.env.RESERVED_PROCESS_SLOTS || '5', 10);
if (Number.isFinite(processLimitEnv) && processLimitEnv > reservedSlots) {
  const maxWorkersByProcessLimit = Math.max(1, processLimitEnv - reservedSlots);
  if (numCPUs > maxWorkersByProcessLimit) {
    logger.warn(`Requested ${numCPUs} workers exceeds process limit (${processLimitEnv}); capping to ${maxWorkersByProcessLimit}`);
    numCPUs = maxWorkersByProcessLimit;
  }
}

if (numCPUs > hardCap) {
  logger.warn(`Requested ${numCPUs} workers exceeds hard cap ${hardCap}; capping to ${hardCap}`);
  numCPUs = hardCap;
}

// Restart tracking to prevent rapid respawn storms
const RESTART_WINDOW_MS = Number(process.env.WORKER_RESTART_WINDOW_MS || 60000);
const MAX_RESTARTS_IN_WINDOW = Number(process.env.WORKER_MAX_RESTARTS || 5);
const RESTART_BACKOFF_BASE_MS = Number(process.env.WORKER_RESTART_BACKOFF_MS || 2000);
const restartHistory = [];

// Allow forcing single-process mode (useful on shared hosts like cPanel)
if (env.DISABLE_CLUSTER || process.env.DISABLE_CLUSTER === '1' || process.env.DISABLE_CLUSTER === 'true') {
  logger.info('DISABLE_CLUSTER set — running single-process mode');
  process.env.NUM_WORKERS = '1';
  // Start app directly in this process
  require('./src/app'); // eslint-disable-line global-require
  logger.info(`Worker ${process.pid} started (single-process)`);
} else if (cluster.isMaster || cluster.isPrimary) {
  logger.info(`Master ${process.pid} is running`);
  logger.info(`Detected ${detectedCPUs} CPU(s); using ${numCPUs} worker(s) (MAX_WORKERS=${process.env.MAX_WORKERS || 'unset'})`);
  logger.info(`Spawning ${numCPUs} worker(s)...`);

  // Expose actual number of workers to worker processes so they can size resources (DB pools) accordingly
  process.env.NUM_WORKERS = String(numCPUs);

  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} exited (signal: ${signal || code}).`);
    const now = Date.now();
    restartHistory.push(now);
    // trim old entries
    while (restartHistory.length && restartHistory[0] < now - RESTART_WINDOW_MS) restartHistory.shift();

    if (restartHistory.length > MAX_RESTARTS_IN_WINDOW) {
      const over = restartHistory.length - MAX_RESTARTS_IN_WINDOW;
      const delay = RESTART_BACKOFF_BASE_MS * Math.pow(2, Math.max(0, over - 1));
      logger.error(`Too many worker restarts (${restartHistory.length} in ${Math.round(RESTART_WINDOW_MS/1000)}s). Backoff ${delay}ms before restarting.`);
      setTimeout(() => {
        try {
          cluster.fork();
        } catch (err) {
          logger.error(`Failed to fork worker after backoff: ${err.message}`);
        }
      }, delay);
    } else {
      try {
        cluster.fork();
      } catch (err) {
        logger.error(`Failed to fork worker: ${err.message}`);
      }
    }
  });
} else {
  // Worker process — run the Express app
  require('./src/app'); // eslint-disable-line global-require
  logger.info(`Worker ${process.pid} started`);
}
