const Joi = require("joi");

const connectAccountValidation = async (req, res, next) => {
  const Schema = Joi.object({
    country: Joi.string().optional(),
    sellerId: Joi.string().required(),
    code: Joi.string().required()
  });
  const { error } = Schema.validate(req.body);
  if (error) {
    return res.status(203).send({
      isSuccess: false,
      message: error.message,
    });
  } else {
    next();
  }
};

module.exports = {
  connectAccountValidation,
};
