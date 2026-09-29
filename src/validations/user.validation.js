const { body } = require('express-validator');

const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Provide a valid phone number'),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('dateOfBirth')
    .optional({ checkFalsy: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('dateOfBirth must be YYYY-MM-DD')
    .custom((v) => new Date(v) < new Date()).withMessage('dateOfBirth must be in the past'),
  body('bloodGroup').optional({ checkFalsy: true }).isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('address').optional().trim().isLength({ max: 300 }),
  body('emergencyContact').optional().isObject().withMessage('emergencyContact must be an object'),
  body('emergencyContact.name').optional().trim().isLength({ max: 80 }),
  body('emergencyContact.phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid emergency phone'),
  body('emergencyContact.relation').optional().trim().isLength({ max: 40 }),
];

module.exports = { updateProfileValidation };
