/** admin.doctor.routes.js -> /api/v1/admin/doctors */
const router = require('express').Router();
const controller = require('../../controllers/doctor.controller');
const validate = require('../../middlewares/validate.middleware');
const parseJsonFields = require('../../middlewares/parseJsonFields.middleware');
const { uploadDoctorImage } = require('../../middlewares/upload.middleware');
const { idParam } = require('../../validations/common.validation');
const { createDoctorValidation, updateDoctorValidation } = require('../../validations/doctor.validation');

const jsonFields = parseJsonFields('availability', 'qualifications', 'languages');

/**
 * @swagger
 * /admin/doctors:
 *   get:
 *     tags: [Admin - Doctors]
 *     summary: List all doctors including inactive
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: q, schema: { type: string } }
 *       - { in: query, name: department, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated doctors }
 *   post:
 *     tags: [Admin - Doctors]
 *     summary: Create a doctor
 *     description: multipart/form-data. `availability`, `qualifications`, `languages` are JSON strings.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, department, consultationFee]
 *             properties:
 *               name: { type: string }
 *               department: { type: string }
 *               designation: { type: string }
 *               specialization: { type: string }
 *               qualifications: { type: string, example: '["MBBS","MD"]' }
 *               experienceYears: { type: integer }
 *               gender: { type: string, enum: [male, female, other] }
 *               languages: { type: string, example: '["English","Hindi"]' }
 *               bio: { type: string }
 *               consultationFee: { type: number }
 *               availability: { type: string, example: '[{"dayOfWeek":1,"startTime":"09:00","endTime":"13:00","slotDurationMinutes":30}]' }
 *               isFeatured: { type: boolean }
 *               image: { type: string, format: binary }
 *     responses:
 *       201: { description: Created }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router
  .route('/')
  .get(controller.listDoctorsAdmin)
  .post(uploadDoctorImage, jsonFields, createDoctorValidation, validate, controller.createDoctor);

/**
 * @swagger
 * /admin/doctors/{id}:
 *   put:
 *     tags: [Admin - Doctors]
 *     summary: Update a doctor (profile, schedule, visibility)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, properties: { name: { type: string }, department: { type: string }, consultationFee: { type: number }, availability: { type: string }, isActive: { type: boolean }, isFeatured: { type: boolean }, isAcceptingAppointments: { type: boolean }, image: { type: string, format: binary } } }
 *     responses:
 *       200: { description: Updated }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 *   delete:
 *     tags: [Admin - Doctors]
 *     summary: Deactivate a doctor (blocked while upcoming appointments exist)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deactivated }
 *       400: { description: Has upcoming appointments }
 */
router
  .route('/:id')
  .put(uploadDoctorImage, idParam('id'), jsonFields, updateDoctorValidation, validate, controller.updateDoctor)
  .delete(idParam('id'), validate, controller.deactivateDoctor);

module.exports = router;
