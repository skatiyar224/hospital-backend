/** contact.routes.js -> /api/v1/contact (public) */
const router = require('express').Router();
const controller = require('../../controllers/contact.controller');
const validate = require('../../middlewares/validate.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');
const { contactValidation } = require('../../validations/contact.validation');

/**
 * @swagger
 * /contact:
 *   post:
 *     tags: [Contact]
 *     summary: Send a message to the hospital (rate limited)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, subject, message]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               subject: { type: string }
 *               message: { type: string }
 *     responses:
 *       201: { description: Message received }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/', authLimiter, contactValidation, validate, controller.submitMessage);

module.exports = router;
