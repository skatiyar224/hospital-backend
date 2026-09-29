const { body, query } = require('express-validator');

const createAppointmentValidation = [
  body('doctor').notEmpty().withMessage('doctor is required').isMongoId().withMessage('Invalid doctor id'),
  body('appointmentDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('appointmentDate must be YYYY-MM-DD'),
  body('timeSlot').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('timeSlot must be HH:mm'),
  body('patientName').optional().trim().isLength({ min: 2, max: 80 }),
  body('patientPhone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Provide a valid phone number'),
  body('patientAge').optional({ checkFalsy: true }).isInt({ min: 0, max: 120 }),
  body('patientGender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']),
  body('reason').optional().trim().isLength({ max: 500 }),
];

const cancelAppointmentValidation = [body('cancelReason').optional().trim().isLength({ max: 300 })];

const listAppointmentsValidation = [
  query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']),
  query('doctor').optional().isMongoId(),
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
  query('from').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  query('to').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const updateStatusValidation = [
  body('status').notEmpty().isIn(['confirmed', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status'),
  body('adminNotes').optional().trim().isLength({ max: 1000 }),
  body('cancelReason').optional().trim().isLength({ max: 300 }),
];

module.exports = { createAppointmentValidation, cancelAppointmentValidation, listAppointmentsValidation, updateStatusValidation };
