/**
 * auth.controller.js
 * ------------------------------------------------------------------
 * Patient registration, login, token refresh, logout, and "who am I".
 * Access tokens are returned in the JSON body (stored client-side in
 * memory); refresh tokens are set as httpOnly cookies scoped to the
 * /api/v1/auth path, so they are never exposed to client-side JS.
 * ------------------------------------------------------------------
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require('../utils/generateToken');

/**
 * @desc   Register a new patient account
 * @route  POST /api/v1/auth/register
 * @access Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const user = await User.create({ name, email, password, phone });


  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  setRefreshTokenCookie(res, refreshToken);

  sendSuccess(res, 201, 'Account created successfully', {
    user: user.toSafeObject(),
    accessToken,
  });
});

/**
 * @desc   Login with email & password
 * @route  POST /api/v1/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact support.');
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  setRefreshTokenCookie(res, refreshToken);

  sendSuccess(res, 200, 'Logged in successfully', {
    user: user.toSafeObject(),
    accessToken,
  });
});

/**
 * @desc   Exchange a valid refresh-token cookie for a new access token
 * @route  POST /api/v1/auth/refresh
 * @access Public (requires refreshToken cookie)
 */
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw ApiError.unauthorized('No refresh token provided.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Refresh token invalid or expired. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User no longer exists or is deactivated.');
  }

  const accessToken = generateAccessToken(user._id, user.role);

  // Rotate the refresh token on every use (mitigates replay of a stolen token).
  const newRefreshToken = generateRefreshToken(user._id);
  setRefreshTokenCookie(res, newRefreshToken);

  sendSuccess(res, 200, 'Access token refreshed', { accessToken });
});

/**
 * @desc   Log out (clears refresh token cookie)
 * @route  POST /api/v1/auth/logout
 * @access Private
 */
const logout = asyncHandler(async (req, res) => {
  clearRefreshTokenCookie(res);
  sendSuccess(res, 200, 'Logged out successfully', null);
});

/**
 * @desc   Get the currently authenticated user
 * @route  GET /api/v1/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Current user fetched', { user: req.user.toSafeObject() });
});

module.exports = { register, login, refresh, logout, getMe };
