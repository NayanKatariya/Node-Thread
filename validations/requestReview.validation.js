const Joi = require('joi');

// Joi validation schema for scheduleReview
const scheduleReviewValidationSchema = Joi.object({

    orderId: Joi.array().items(Joi.string().required()).required().messages({
        'array.base': `"orderId" should be an array`,
        'array.includesRequiredUnknowns': `"orderId" must contain only non-empty strings`,
        'any.required': `"orderId" is required`,
        'string.base': `"orderId" must be an array of strings`,
        'string.empty': `"orderId" cannot contain empty strings`,
    }),
    afterDays: Joi.number().integer().required().messages({
        'number.base': `"afterDays" should be a number`,
        'number.integer': `"afterDays" must be an integer`,
        'any.required': `"afterDays" is required`,
    }),
    isAutomated: Joi.boolean().required().messages({
        'string.base': `"isAutomated" should be a string`,
        'any.only': `"isAutomated" must be either true or false`,
        'any.required': `"isAutomated" is required`,
    })
});

// Validation Middleware
const validateScheduleReview = (req, res, next) => {
    const { error } = scheduleReviewValidationSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            message: 'Validation error',
            error: error.details[0].message,
            isSuccess: false
        });
    }
    // Proceed to the next middleware or controller if validation is successful
    next();
};

module.exports = validateScheduleReview;
