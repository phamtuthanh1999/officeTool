const Joi = require('joi');

const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(2000).allow('', null).default(null),
  status: Joi.string().valid('pending', 'in_progress', 'done').default('pending'),
  due_date: Joi.date().iso().allow(null).default(null),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255),
  description: Joi.string().max(2000).allow('', null),
  status: Joi.string().valid('pending', 'in_progress', 'done'),
  due_date: Joi.date().iso().allow(null),
}).min(1);

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return res.status(400).json({ status: 'fail', message });
  }
  req.body = value;
  return next();
};

module.exports = { createTaskSchema, updateTaskSchema, validate };
