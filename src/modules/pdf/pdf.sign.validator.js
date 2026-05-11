const Joi = require('joi');
const AppError = require('../../utils/AppError');

const signSchema = Joi.object({
  page: Joi.alternatives()
    .try(
      Joi.string().valid('all', 'first', 'last'),
      Joi.number().integer().min(1)
    )
    .default('last'),
  position: Joi.string()
    .valid('bottom-right', 'bottom-left', 'bottom-center', 'top-right', 'top-left', 'center', 'custom')
    .default('bottom-right'),
  xPct: Joi.number().min(0).max(1).when('position', { is: 'custom', then: Joi.required() }),
  yPct: Joi.number().min(0).max(1).when('position', { is: 'custom', then: Joi.required() }),
  sigWidth: Joi.number().integer().min(20).max(600).default(160),
  anchorFromTop: Joi.boolean().default(false),
});

function validateSignParams(data) {
  // Convert string numbers from multipart body
  const parsed = {
    page: data.page,
    position: data.position,
    sigWidth: data.sigWidth ? Number(data.sigWidth) : undefined,
    xPct: data.xPct !== undefined ? Number(data.xPct) : undefined,
    yPct: data.yPct !== undefined ? Number(data.yPct) : undefined,
    anchorFromTop: data.anchorFromTop !== undefined ? data.anchorFromTop : undefined,
  };

  // Try to parse page as number if it looks like one
  if (parsed.page && !isNaN(Number(parsed.page))) {
    parsed.page = Number(parsed.page);
  }

  // Remove undefined keys
  Object.keys(parsed).forEach((k) => parsed[k] === undefined && delete parsed[k]);

  const { error, value } = signSchema.validate(parsed, { abortEarly: false });
  if (error) {
    const msg = error.details.map((d) => d.message).join('; ');
    throw new AppError(`Tham số không hợp lệ: ${msg}`, 400);
  }
  return value;
}

module.exports = { validateSignParams };
