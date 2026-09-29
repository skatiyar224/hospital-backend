/** admin.patient.routes.js -> /api/v1/admin/patients */
const router = require('express').Router();
const controller = require('../../controllers/admin.patient.controller');
const validate = require('../../middlewares/validate.middleware');
const { idParam } = require('../../validations/common.validation');
const { setActiveValidation } = require('../../validations/adminUser.validation');

/**
 * @swagger
 * /admin/patients:
 *   get:
 *     tags: [Admin - Patients]
 *     summary: List patient accounts
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: q, schema: { type: string }, description: Name, email or phone }
 *       - { in: query, name: isActive, schema: { type: boolean } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated patients }
 */
router.get('/', controller.listPatients);

/**
 * @swagger
 * /admin/patients/{id}:
 *   get:
 *     tags: [Admin - Patients]
 *     summary: Patient profile with recent appointments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Patient detail }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.get('/:id', idParam('id'), validate, controller.getPatient);

/**
 * @swagger
 * /admin/patients/{id}/status:
 *   patch:
 *     tags: [Admin - Patients]
 *     summary: Activate or deactivate a patient account
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object, required: [isActive], properties: { isActive: { type: boolean } } } } }
 *     responses:
 *       200: { description: Updated }
 */
router.patch('/:id/status', idParam('id'), setActiveValidation, validate, controller.setPatientActive);

module.exports = router;
