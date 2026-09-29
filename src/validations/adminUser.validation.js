const { body } = require('express-validator');

const setActiveValidation = [body('isActive').notEmpty().isBoolean().withMessage('isActive must be a boolean')];

module.exports = { setActiveValidation };
