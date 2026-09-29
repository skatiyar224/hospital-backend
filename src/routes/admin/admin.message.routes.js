/** admin.message.routes.js -> /api/v1/admin/messages */
const router = require('express').Router();
const controller = require('../../controllers/contact.controller');
const validate = require('../../middlewares/validate.middleware');
const { idParam } = require('../../validations/common.validation');
const { updateMessageStatusValidation } = require('../../validations/contact.validation');

/**
 * @swagger
 * /admin/messages:
 *   get:
 *     tags: [Admin - Messages]
 *     summary: Contact-form inbox
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [new, in_progress, resolved] } }
 *       - { in: query, name: q, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated messages }
 */
router.get('/', controller.listMessages);

/**
 * @swagger
 * /admin/messages/{id}:
 *   patch:
 *     tags: [Admin - Messages]
 *     summary: Update a message's status
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object, required: [status], properties: { status: { type: string, enum: [new, in_progress, resolved] } } } } }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Admin - Messages]
 *     summary: Delete a message
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */
router
  .route('/:id')
  .patch(idParam('id'), updateMessageStatusValidation, validate, controller.updateMessageStatus)
  .delete(idParam('id'), validate, controller.deleteMessage);

module.exports = router;
