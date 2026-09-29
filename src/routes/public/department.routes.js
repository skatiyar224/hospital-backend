/** department.routes.js -> /api/v1/departments (public, read-only) */
const router = require('express').Router();
const controller = require('../../controllers/department.controller');

/**
 * @swagger
 * /departments:
 *   get:
 *     tags: [Departments]
 *     summary: List active departments with doctor counts
 *     responses:
 *       200:
 *         description: Department list
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ApiSuccess' } } }
 */
router.get('/', controller.listDepartments);

/**
 * @swagger
 * /departments/{idOrSlug}:
 *   get:
 *     tags: [Departments]
 *     summary: Get one department by id or slug
 *     parameters:
 *       - { in: path, name: idOrSlug, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Department detail }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.get('/:idOrSlug', controller.getDepartment);

module.exports = router;
