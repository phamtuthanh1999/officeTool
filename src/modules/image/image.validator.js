const Joi = require('joi');
const AppError = require('../../utils/AppError');

const resizeSchema = Joi.object({
  width: Joi.number().integer().min(1).max(8000).optional(),
  height: Joi.number().integer().min(1).max(8000).optional(),
  format: Joi.string().valid('jpeg', 'png', 'webp').default('jpeg'),
  fit: Joi.string()
    .valid('cover', 'contain', 'fill', 'inside', 'outside')
    .default('inside'),
  quality: Joi.number().integer().min(10).max(100).default(90),
  maintainAspect: Joi.boolean().default(true),
}).or('width', 'height'); // ít nhất 1 trong 2 phải có

/**
 * Validate resize params từ request body/query.
 * Ném AppError nếu không hợp lệ.
 */
function validateResizeParams(data) {
  const { error, value } = resizeSchema.validate(data, { abortEarly: false, convert: true });
  if (error) {
    const msg = error.details.map((d) => d.message).join('; ');
    throw new AppError(`Tham số không hợp lệ: ${msg}`, 400);
  }
  return value;
}

module.exports = { validateResizeParams };
