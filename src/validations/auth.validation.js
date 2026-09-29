/**
 * auth.validation.js
 * ------------------------------------------------------------------
 * express-validator chains for authentication endpoints. Each export
 * is an array of middleware passed straight to the route, followed
 * by the shared `validate` middleware that turns failures into a
 * single 422 ApiError.
 * ------------------------------------------------------------------
 */

const { body } = require('express-validator');

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Provide a valid email').normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Provide a valid phone number'),
];

const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('New password must contain at least one number'),
];

module.exports = { registerValidation, loginValidation, changePasswordValidation };
