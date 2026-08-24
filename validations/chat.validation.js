const Joi = require("joi");

const askChatSchema = Joi.object({
  asin: Joi.string().required(),
  question: Joi.string().required(),
});

const validateAskChat = (req, res, next) => {
  const { error } = askChatSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
      isSuccess: false,
    });
  }
  next();
};

module.exports = validateAskChat;
