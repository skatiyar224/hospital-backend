/** admin.dashboard.routes.js -> /api/v1/admin/dashboard */
const router = require('express').Router();
const controller = require('../../controllers/admin.dashboard.controller');

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: Overview stats (counts, today's schedule, next 7 days, unread messages)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard stats
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ApiSuccess' } } }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.get('/', controller.getDashboardStats);

module.exports = router;
