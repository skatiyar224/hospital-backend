/**
 * generateToken.js
 * ------------------------------------------------------------------
 * Centralizes JWT creation so token payload shape, secrets, and
 * expiry rules live in exactly one place.
 *
 * Access token  -> short-lived, sent in the Authorization header,
 *                  used to authenticate normal API requests.
 * Refresh token -> long-lived, stored in an httpOnly cookie, used
 *                  only to mint a new access token via /auth/refresh.
 * ------------------------------------------------------------------
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

/**
 * Sets the refresh token as an httpOnly, secure (in prod), sameSite
 * cookie on the response. Keeping this here (rather than duplicated
 * in every auth controller action) guarantees identical cookie flags
 * everywhere the refresh token is issued.
 */
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: env.JWT_COOKIE_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/' + env.API_VERSION + '/auth',
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', { path: '/api/' + env.API_VERSION + '/auth' });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
