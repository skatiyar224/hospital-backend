/**
 * apiResponse.js
 * ------------------------------------------------------------------
 * Ensures every successful response has the same envelope shape:
 *   { success: true, message, data, meta? }
 * Controllers call `sendSuccess(res, ...)` instead of `res.json(...)`
 * directly, keeping response formatting consistent and easy to
 * change globally (e.g. adding a `requestId`) in one place.
 * ------------------------------------------------------------------
 */

/**
 * @param {import('express').Response} res
 * @param {number} statusCode - HTTP status code (200, 201, ...)
 * @param {string} message - Short human-readable message
 * @param {*} data - Payload (object, array, null)
 * @param {object} [meta] - Optional extra metadata (e.g. pagination info)
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = undefined) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess };
