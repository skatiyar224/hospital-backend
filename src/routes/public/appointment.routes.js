/** appointment.routes.js -> /api/v1/appointments (authenticated patient) */
const router = require('express').Router();
const controller = require('../../controllers/appointment.controller');
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { idParam } = require('../../validations/common.validation');
const { createAppointmentValidation, cancelAppointmentValidation } = require('../../validations/appointment.validation');

router.use(protect);

/**
 * @swagger
 * /appointments:
 *   post:
 *     tags: [Appointments]
 *     summary: Book an appointment (pay at hospital)
 *     description: Fails with 409 if the slot was taken in the meantime, or if you already have an appointment at that time.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctor, appointmentDate, timeSlot]
 *             properties:
 *               doctor: { type: string }
 *               appointmentDate: { type: string, example: '2026-10-05' }
 *               timeSlot: { type: string, example: '10:30' }
 *               patientName: { type: string, description: Defaults to the account name (book for someone else by changing it) }
 *               patientPhone: { type: string }
 *               patientAge: { type: integer }
 *               patientGender: { type: string, enum: [male, female, other] }
 *               reason: { type: string }
 *     responses:
 *       201: { description: Booked (status pending until the hospital confirms) }
 *       400: { description: Slot not in schedule / past / too far ahead }
 *       409: { description: Slot taken or overlapping appointment }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   get:
 *     tags: [Appointments]
 *     summary: List my appointments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: when, schema: { type: string, enum: [upcoming, past] } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated appointments }
 */
router.route('/').post(createAppointmentValidation, validate, controller.createAppointment).get(controller.getMyAppointments);

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     tags: [Appointments]
 *     summary: Get one of my appointments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Appointment }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.get('/:id', idParam('id'), validate, controller.getAppointment);

/**
 * @swagger
 * /appointments/{id}/cancel:
 *   patch:
 *     tags: [Appointments]
 *     summary: Cancel my appointment (frees the slot)
 *     description: Only pending/confirmed appointments, and only until CANCELLATION_CUTOFF_HOURS before the visit.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content: { application/json: { schema: { type: object, properties: { cancelReason: { type: string } } } } }
 *     responses:
 *       200: { description: Cancelled }
 *       400: { description: Not cancellable }
 */
router.patch('/:id/cancel', idParam('id'), cancelAppointmentValidation, validate, controller.cancelMyAppointment);

module.exports = router;
