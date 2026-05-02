/**
 * Wraps an async route handler so any rejected promise is forwarded to Express
 * error-handling middleware instead of causing an unhandled rejection.
 *
 * Usage: router.get('/path', catchAsync(async (req, res) => { ... }))
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
