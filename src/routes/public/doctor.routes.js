/** doctor.routes.js -> /api/v1/doctors (public, read-only) */
const router = require('express').Router();
const controller = require('../../controllers/doctor.controller');
const validate = require('../../middlewares/validate.middleware');
const { idParam } = require('../../validations/common.validation');
const { listDoctorsValidation, slotsQueryValidation } = require('../../validations/doctor.validation');

/**
 * @swagger
 * /doctors:
 *   get:
 *     tags: [Doctors]
 *     summary: Search and filter doctors
 *     parameters:
 *       - { in: query, name: q, schema: { type: string }, description: Name, specialization or designation }
 *       - { in: query, name: department, schema: { type: string }, description: Department ObjectId }
 *       - { in: query, name: gender, schema: { type: string, enum: [male, female, other] } }
 *       - { in: query, name: featured, schema: { type: boolean } }
 *       - { in: query, name: sort, schema: { type: string, enum: [name, experience, fee_asc, fee_desc] } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 12 } }
 *     responses:
 *       200:
 *         description: Paginated doctors
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ApiSuccess' } } }
 */
router.get('/', listDoctorsValidation, validate, controller.listDoctors);

/**
 * @swagger
 * /doctors/{id}/slots:
 *   get:
 *     tags: [Doctors]
 *     summary: Bookable time slots for a doctor on a date
 *     description: Returns every slot in the doctor's schedule for that weekday, each flagged available or not (already booked, or in the past).
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: date, required: true, schema: { type: string, example: '2026-10-05' } }
 *     responses:
 *       200: { description: Slots for the date }
 *       400: { description: Invalid, past, or too-far-ahead date }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.get('/:id/slots', idParam('id'), slotsQueryValidation, validate, controller.getDoctorSlots);

/**
 * @swagger
 * /doctors/{idOrSlug}:
 *   get:
 *     tags: [Doctors]
 *     summary: Get a doctor profile by id or slug
 *     parameters:
 *       - { in: path, name: idOrSlug, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Doctor profile incl. weekly availability }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.get('/:idOrSlug', controller.getDoctor);

module.exports = router;
