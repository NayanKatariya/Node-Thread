const Joi = require("joi");

// Request body validation schema using Joi
const schema = Joi.object({
  prompt: Joi.string().min(5).max(1000).required().messages({
    "string.empty": "Prompt is required",
    "string.min": "Prompt must be at least 5 characters long",
    "string.max": "Prompt must not exceed 1000 characters",
  }),
});

// Validation middleware
const validateRequest = (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      isSuccess: false,
      message: error.details[0].message,
    });
  }
  next();
};

const messageSchema = Joi.array()
  .items(
    Joi.object({
      role: Joi.string().valid("user", "assistant").required(),
      content: Joi.array()
        .items(
          Joi.object({
            type: Joi.string().valid("text").required(),
            text: Joi.string().required(),
          })
        )
        .required(),
    })
  )
  .required();

const messageValidation = (req, res, next) => {
  const { error } = messageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      isSuccess: false,
      message: error.details[0].message,
    });
  }
  next();
};

module.exports = { validateRequest, messageValidation };
