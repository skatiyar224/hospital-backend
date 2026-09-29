/** user.routes.js -> /api/v1/users (authenticated patient, self-service) */
const router = require('express').Router();
const userController = require('../../controllers/user.controller');
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { uploadAvatar } = require('../../middlewares/upload.middleware');
const { updateProfileValidation } = require('../../validations/user.validation');
const { changePasswordValidation } = require('../../validations/auth.validation');

router.use(protect);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update own profile (contact + medical details)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               gender: { type: string, enum: [male, female, other] }
 *               dateOfBirth: { type: string, example: '1990-04-21' }
 *               bloodGroup: { type: string, enum: [A+, A-, B+, B-, AB+, AB-, O+, O-] }
 *               address: { type: string }
 *               emergencyContact: { type: object, properties: { name: { type: string }, phone: { type: string }, relation: { type: string } } }
 *     responses:
 *       200: { description: Profile updated }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.patch('/me', updateProfileValidation, validate, userController.updateProfile);

/**
 * @swagger
 * /users/me/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload own avatar
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, properties: { avatar: { type: string, format: binary } } }
 *     responses:
 *       200: { description: Avatar updated }
 */
router.post('/me/avatar', uploadAvatar, userController.updateAvatar);

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     tags: [Users]
 *     summary: Change own password
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties: { currentPassword: { type: string }, newPassword: { type: string } }
 *     responses:
 *       200: { description: Password changed }
 *       400: { description: Current password incorrect }
 */
router.patch('/me/password', changePasswordValidation, validate, userController.changePassword);

module.exports = router;
