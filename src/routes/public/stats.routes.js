/** stats.routes.js -> /api/v1/stats (public) */
const router = require('express').Router();
const controller = require('../../controllers/stats.controller');

/**
 * @swagger
 * /stats:
 *   get:
 *     tags: [Stats]
 *     summary: Headline numbers for the home page
 *     responses:
 *       200: { description: "{ doctors, departments, patients, appointmentsCompleted }" }
 */
router.get('/', controller.getPublicStats);

module.exports = router;
