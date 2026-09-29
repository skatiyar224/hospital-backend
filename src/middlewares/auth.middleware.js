/**
 * auth.middleware.js
 * ------------------------------------------------------------------
 * `protect` verifies the JWT access token sent in the
 * `Authorization: Bearer <token>` header, loads the corresponding
 * user (without the password hash), and attaches it to `req.user`.
 *
 * `authorize(...roles)` is a small factory used AFTER `protect` to
 * restrict a route to specific roles, e.g. `authorize('admin')`.
 * Keeping authentication and authorization as two separate,
 * composable middlewares (rather than one big one) keeps route
 * definitions declarative and easy to read:
 *
 *   router.post('/products', protect, authorize('admin'), createProduct)
 * ------------------------------------------------------------------
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Not authenticated. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired. Please refresh your session.');
    }
    throw ApiError.unauthorized('Invalid access token.');
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw ApiError.unauthorized('User belonging to this token no longer exists.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact support.');
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Not authenticated.'));
  }
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Role '${req.user.role}' is not permitted to access this resource.`));
  }
  next();
};

module.exports = { protect, authorize };
