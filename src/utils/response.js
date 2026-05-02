/**
 * Send a standardised success response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {object} data
 * @param {object} [meta] - optional pagination / extra metadata
 */
const sendSuccess = (res, statusCode, data, meta = {}) => {
  const response = { status: 'success', data };
  if (Object.keys(meta).length) response.meta = meta;
  res.status(statusCode).json(response);
};

/**
 * Send a standardised fail response (client error).
 */
const sendFail = (res, statusCode, message) => {
  res.status(statusCode).json({ status: 'fail', message });
};

module.exports = { sendSuccess, sendFail };
