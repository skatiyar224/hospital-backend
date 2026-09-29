/** admin.department.routes.js -> /api/v1/admin/departments */
const router = require('express').Router();
const controller = require('../../controllers/department.controller');
const validate = require('../../middlewares/validate.middleware');
const parseJsonFields = require('../../middlewares/parseJsonFields.middleware');
const { uploadDepartmentImage } = require('../../middlewares/upload.middleware');
const { idParam } = require('../../validations/common.validation');
const { createDepartmentValidation, updateDepartmentValidation } = require('../../validations/department.validation');

/**
 * @swagger
 * /admin/departments:
 *   get:
 *     tags: [Admin - Departments]
 *     summary: List all departments including inactive
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Department list }
 *   post:
 *     tags: [Admin - Departments]
 *     summary: Create a department
 *     description: multipart/form-data. Send `services` as a JSON array string.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               shortDescription: { type: string }
 *               description: { type: string }
 *               icon: { type: string, example: heart }
 *               displayOrder: { type: integer }
 *               services: { type: string, example: '["ECG","Echocardiography"]' }
 *               image: { type: string, format: binary }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Name already exists }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router
  .route('/')
  .get(controller.listDepartmentsAdmin)
  .post(uploadDepartmentImage, parseJsonFields('services'), createDepartmentValidation, validate, controller.createDepartment);

/**
 * @swagger
 * /admin/departments/{id}:
 *   put:
 *     tags: [Admin - Departments]
 *     summary: Update a department
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, properties: { name: { type: string }, shortDescription: { type: string }, description: { type: string }, icon: { type: string }, displayOrder: { type: integer }, isActive: { type: boolean }, services: { type: string }, image: { type: string, format: binary } } }
 *     responses:
 *       200: { description: Updated }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 *   delete:
 *     tags: [Admin - Departments]
 *     summary: Delete a department (blocked while active doctors belong to it)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 *       400: { description: Still has doctors }
 */
router
  .route('/:id')
  .put(uploadDepartmentImage, idParam('id'), parseJsonFields('services'), updateDepartmentValidation, validate, controller.updateDepartment)
  .delete(idParam('id'), validate, controller.deleteDepartment);

module.exports = router;
