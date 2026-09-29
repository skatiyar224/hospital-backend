const { body } = require('express-validator');

const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Provide a valid email').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Provide a valid phone number'),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 150 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ min: 10, max: 3000 }).withMessage('Message must be 10-3000 characters'),
];

const updateMessageStatusValidation = [
  body('status').notEmpty().isIn(['new', 'in_progress', 'resolved']).withMessage('Invalid status'),
];

module.exports = { contactValidation, updateMessageStatusValidation };
