const Joi = require('joi');

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email().lowercase(),
}).min(1);

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return res.status(400).json({ status: 'fail', message });
  }
  return next();
};

module.exports = { updateUserSchema, validate };
