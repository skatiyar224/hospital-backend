/**
 * parseJsonFields.middleware.js
 * ------------------------------------------------------------------
 * multipart/form-data can only carry strings, so the admin panel sends
 * arrays/objects (availability, qualifications...) as JSON strings. This
 * middleware parses the named fields back into real values BEFORE
 * validation runs. Plain JSON requests pass through untouched.
 * ------------------------------------------------------------------
 */
const ApiError = require('../utils/apiError');

const parseJsonFields = (...fields) => (req, res, next) => {
  for (const field of fields) {
    const value = req.body[field];
    if (typeof value === 'string') {
      try {
        req.body[field] = JSON.parse(value);
      } catch {
        return next(ApiError.badRequest(`Field "${field}" must be valid JSON`));
      }
    }
  }
  next();
};

module.exports = parseJsonFields;
