/** admin.appointment.routes.js -> /api/v1/admin/appointments */
const router = require('express').Router();
const controller = require('../../controllers/appointment.controller');
const validate = require('../../middlewares/validate.middleware');
const { idParam } = require('../../validations/common.validation');
const { listAppointmentsValidation, updateStatusValidation } = require('../../validations/appointment.validation');

/**
 * @swagger
 * /admin/appointments:
 *   get:
 *     tags: [Admin - Appointments]
 *     summary: List all appointments with filters
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [pending, confirmed, completed, cancelled, no_show] } }
 *       - { in: query, name: doctor, schema: { type: string } }
 *       - { in: query, name: date, schema: { type: string, example: '2026-10-05' } }
 *       - { in: query, name: from, schema: { type: string } }
 *       - { in: query, name: to, schema: { type: string } }
 *       - { in: query, name: q, schema: { type: string }, description: Appointment code, patient name or phone }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated appointments }
 */
router.get('/', listAppointmentsValidation, validate, controller.listAppointmentsAdmin);

/**
 * @swagger
 * /admin/appointments/{id}/status:
 *   patch:
 *     tags: [Admin - Appointments]
 *     summary: Change appointment status
 *     description: "Allowed transitions: pending→confirmed|cancelled, confirmed→completed|cancelled|no_show. Cancelling frees the slot. Future visits cannot be marked completed/no_show."
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [confirmed, completed, cancelled, no_show] }
 *               adminNotes: { type: string }
 *               cancelReason: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       400: { description: Invalid transition }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.patch('/:id/status', idParam('id'), updateStatusValidation, validate, controller.updateAppointmentStatus);

module.exports = router;
