/**
 * routes/index.js
 * ------------------------------------------------------------------
 * The single entry point app.js imports. Mounts the two top-level,
 * physically separate namespaces:
 *
 *   /api/v1/**        -> public storefront routes (routes/public)
 *   /api/v1/admin/**  -> admin-only routes       (routes/admin)
 * ------------------------------------------------------------------
 */

const router = require('express').Router();

router.use('/admin', require('./admin'));
router.use('/', require('./public'));

module.exports = router;
