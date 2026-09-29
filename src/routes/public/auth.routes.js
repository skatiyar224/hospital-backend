/**
 * auth.routes.js  ->  /api/v1/auth
 * ------------------------------------------------------------------
 */

const router = require('express').Router();
const authController = require('../../controllers/auth.controller');
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');
const { registerValidation, loginValidation } = require('../../validations/auth.validation');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new patient account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Jane Doe }
 *               email: { type: string, example: jane@example.com }
 *               password: { type: string, format: password, example: Str0ngPass! }
 *               phone: { type: string, example: '+919876543210' }
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       409: { description: Email already registered, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/register', authLimiter, registerValidation, validate, authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email & password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: jane@example.com }
 *               password: { type: string, format: password, example: Str0ngPass! }
 *     responses:
 *       200:
 *         description: Logged in, returns accessToken + sets refreshToken cookie
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/login', authLimiter, loginValidation, validate, authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange the refreshToken cookie for a new access token
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out (clears the refresh token cookie)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Logged out }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 */
router.post('/logout', protect, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 */
router.get('/me', protect, authController.getMe);

module.exports = router;
