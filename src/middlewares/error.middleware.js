/**
 * error.middleware.js
 * ------------------------------------------------------------------
 * Two middlewares, both registered LAST in app.js:
 *
 *  1. `notFound`      - catches any request that didn't match a route
 *                        and turns it into a 404 ApiError.
 *  2. `errorHandler`  - the single place that formats ALL errors
 *                        (ApiError, Mongoose errors, JWT errors, or
 *                        anything unexpected) into the consistent
 *                        { success:false, message, errors } shape.
 * ------------------------------------------------------------------
 */

const env = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Normalize well-known non-ApiError error types into ApiError so the
  // response shape is always identical regardless of the source.
  if (error.name === 'CastError') {
    error = ApiError.badRequest(`Invalid value for field '${error.path}': ${error.value}`);
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`Duplicate value for '${field}'. It must be unique.`);
  } else if (error.name === 'ValidationError' && error.errors) {
    // Mongoose schema validation error
    const details = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.badRequest('Validation failed', details);
  } else if (error.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired');
  } else if (!(error instanceof ApiError)) {
    error = new ApiError(error.statusCode || 500, error.message || 'Internal server error', [], false);
  }

  // Log unexpected (non-operational) errors loudly; operational ones at info level.
  if (!error.isOperational) {
    logger.error(`${req.method} ${req.originalUrl} ->`, err.stack || err.message);
  } else {
    logger.debug(`${req.method} ${req.originalUrl} -> ${error.statusCode} ${error.message}`);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    errors: error.errors && error.errors.length ? error.errors : undefined,
    // Stack trace only in non-production to help local debugging.
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
