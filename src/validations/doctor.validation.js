const { body, query } = require('express-validator');

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const availabilityRules = [
  body('availability').optional().isArray({ max: 30 }).withMessage('availability must be an array'),
  body('availability.*.dayOfWeek').optional().isInt({ min: 0, max: 6 }).withMessage('dayOfWeek must be 0-6'),
  body('availability.*.startTime').optional().matches(TIME).withMessage('startTime must be HH:mm'),
  body('availability.*.endTime').optional().matches(TIME).withMessage('endTime must be HH:mm'),
  body('availability.*.slotDurationMinutes').optional().isInt({ min: 10, max: 120 }).withMessage('slotDurationMinutes must be 10-120'),
  body('availability').optional().custom((entries) =>
    entries.every((e) => e.startTime && e.endTime && e.startTime < e.endTime)
  ).withMessage('Each availability window needs startTime before endTime'),
];

const arrays = [
  body('qualifications').optional().isArray({ max: 20 }),
  body('languages').optional().isArray({ max: 20 }),
];

const createDoctorValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('department').notEmpty().withMessage('Department is required').isMongoId().withMessage('Invalid department id'),
  body('consultationFee').notEmpty().withMessage('Consultation fee is required').isFloat({ min: 0 }).withMessage('Fee must be 0 or more'),
  body('experienceYears').optional({ checkFalsy: true }).isInt({ min: 0, max: 70 }),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']),
  body('designation').optional().trim().isLength({ max: 80 }),
  body('specialization').optional().trim().isLength({ max: 120 }),
  body('bio').optional().trim().isLength({ max: 3000 }),
  ...arrays,
  ...availabilityRules,
];

const updateDoctorValidation = [
  body('name').optional().trim().notEmpty().isLength({ max: 80 }),
  body('department').optional().isMongoId().withMessage('Invalid department id'),
  body('consultationFee').optional().isFloat({ min: 0 }),
  body('experienceYears').optional({ checkFalsy: true }).isInt({ min: 0, max: 70 }),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']),
  body('isActive').optional().isBoolean(),
  body('isFeatured').optional().isBoolean(),
  body('isAcceptingAppointments').optional().isBoolean(),
  ...arrays,
  ...availabilityRules,
];

const listDoctorsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('department').optional().isMongoId().withMessage('department must be a valid id'),
  query('gender').optional().isIn(['male', 'female', 'other']),
  query('sort').optional().isIn(['name', 'experience', 'fee_asc', 'fee_desc']),
];

const slotsQueryValidation = [query('date').notEmpty().withMessage('date is required (YYYY-MM-DD)')];

module.exports = { createDoctorValidation, updateDoctorValidation, listDoctorsValidation, slotsQueryValidation };
