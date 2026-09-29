/**
 * validate.middleware.js
 * ------------------------------------------------------------------
 * Runs after an array of express-validator chains. Collects any
 * validation failures and throws a single 422 ApiError with a
 * field-by-field breakdown, so controllers never need to check
 * `validationResult` themselves.
 *
 * Usage:
 *   router.post('/', registerValidation, validate, authController.register)
 * ------------------------------------------------------------------
 */

const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  next(new ApiError(422, 'Validation failed', formatted));
};

module.exports = validate;
