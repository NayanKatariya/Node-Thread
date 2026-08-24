const Joi = require('joi');

const getAllOrdersSchema = Joi.object({
    search: Joi.string().allow('', null), // Optional search term
    filter: Joi.object({
        marketplace: Joi.string().allow('', null), // Optional marketplace filter
    }).optional(),
    page: Joi.number().integer().min(1).required().messages({
        'number.base': `"page" must be a number`,
        'number.min': `"page" must be at least 1`,
        'any.required': `"page" is required`,
    }),
    limit: Joi.number().integer().min(1).required().messages({
        'number.base': `"limit" must be a number`,
        'number.min': `"limit" must be at least 1`,
        'any.required': `"limit" is required`,
    }),
});

const validateGetAllOrders = (req, res, next) => {
    const { error } = getAllOrdersSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            message: error.details[0].message,
            isSuccess: false,
        });
    }
    next();
};

module.exports = validateGetAllOrders;
