import Joi from '@hapi/joi';

const schema = Joi.object({
  id: Joi.number()
    .integer()
    .min(0)
    .required(),

  error: Joi.object({
    name: Joi.string(),
    message: Joi.string().required()
  }),

  response: Joi.object()
}).xor('error', 'response');

const validateClientMessage = (message) => {
  const { value, error } = schema.validate(message);

  if (error) {
    throw error;
  }

  return value;
};

export default validateClientMessage;
