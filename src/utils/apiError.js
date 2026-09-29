/**
 * apiError.js
 * ------------------------------------------------------------------
 * A single custom Error subclass used everywhere in the app instead
 * of throwing raw strings/objects. Carries an HTTP status code and an
 * optional array of field-level validation errors so the global error
 * middleware can format a consistent JSON response.
 *
 * `isOperational = true` marks "expected" errors (bad input, not
 * found, unauthorized, etc.) as opposed to programming bugs — this
 * distinction is useful if you later want to alert only on the latter.
 * ------------------------------------------------------------------
 */

class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (400, 401, 404, 500, ...)
   * @param {string} message - Human readable error message
   * @param {Array}  errors - Optional array of detailed field errors
   * @param {boolean} isOperational - Whether this is an expected/handled error
   */
  constructor(statusCode, message = 'Something went wrong', errors = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Not authorized to perform this action') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, [], false);
  }
}

module.exports = ApiError;
