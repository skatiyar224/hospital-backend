const { body } = require('express-validator');

const services = body('services').optional().isArray({ max: 30 }).withMessage('services must be an array');

const createDepartmentValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
  body('shortDescription').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 3000 }),
  body('icon').optional().trim().isLength({ max: 40 }),
  body('displayOrder').optional().isInt({ min: 0, max: 1000 }),
  services,
  body('services.*').optional().isString().trim().isLength({ max: 100 }),
];

const updateDepartmentValidation = [
  body('name').optional().trim().notEmpty().isLength({ max: 60 }),
  body('shortDescription').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 3000 }),
  body('icon').optional().trim().isLength({ max: 40 }),
  body('displayOrder').optional().isInt({ min: 0, max: 1000 }),
  body('isActive').optional().isBoolean(),
  services,
  body('services.*').optional().isString().trim().isLength({ max: 100 }),
];

module.exports = { createDepartmentValidation, updateDepartmentValidation };
