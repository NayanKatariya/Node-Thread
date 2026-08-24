const Joi = require("joi");

const registerValidation = async (req, res, next) => {
  const Schema = Joi.object({
    fullName: Joi.string().required().trim().messages({
      "string.empty": "Name should not be empty!",
    }),
    email: Joi.string()
      .regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
      .required()
      .messages({
        "string.empty": "Email should not be empty!",
        "string.pattern.base": "Email should be contain valid character!",
      }),
    password: Joi.string().required().trim().min(6).max(15).messages({
      "string.empty": "Password should not be empty!",
      "string.min": "Password should contain mininum 6 characters!",
      "string.max": "Password is too long!",
    }),
    phoneNumber: Joi.string()
      .required()
      .regex(/^[0-9]{10}$/)
      .messages({ "string.pattern.base": `Phone number must have 10 digits!` })
      .required(),
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

const googleSignUpValidation = async (req, res, next) => {
  const Schema = Joi.object({
    code: Joi.string().required().messages({
      "any.required": "Idtoken is required field!",
    }),
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
const loginValidation = async (req, res, next) => {
  const Schema = Joi.object({
    email: Joi.string()
      .regex(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
      .required()
      .messages({
        "any.required": "Email is required field!",
        "string.empty": "Email should not be empty!",
        "string.pattern.base": "Email should be contain valid character!",
      }),
    password: Joi.string().min(6).max(15).messages({
      "any.required": "Password is required field!",
      "string.empty": "Password should not be empty!",
      "string.min": "Password should contain mininum 6 characters!",
      "string.max": "Password is too long!",
    }),
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
const sendVerificationCodeValidation = async (req, res, next) => {
  const sendVerificationCodeSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(15).required(),
  });
  const { error } = sendVerificationCodeSchema.validate(req.body);
  if (error) {
    return res.status(203).send({
      isSuccess: false,
      message: error.message,
    });
  } else {
    next();
  }
};
const verifyCodeValidation = async (req, res, next) => {
  const verifyCodeSchema = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.number().integer().min(100000).max(999999).required(),
  });
  const { error } = verifyCodeSchema.validate(req.body);
  if (error) {
    return res.status(203).send({
      isSuccess: false,
      message: error.message,
    });
  } else {
    next();
  }
};
const reSendCodeValidation = async (req, res, next) => {
  const verifyCodeSchema = Joi.object({
    email: Joi.string().email().required(),
  });
  const { error } = verifyCodeSchema.validate(req.body);
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
  registerValidation,
  loginValidation,
  googleSignUpValidation,
  sendVerificationCodeValidation,
  verifyCodeValidation,
  reSendCodeValidation
};
