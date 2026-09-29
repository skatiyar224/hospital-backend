/** routes/public/index.js - patient-facing website API (/api/v1/**) */
const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/departments', require('./department.routes'));
router.use('/doctors', require('./doctor.routes'));
router.use('/appointments', require('./appointment.routes'));
router.use('/contact', require('./contact.routes'));
router.use('/stats', require('./stats.routes'));

module.exports = router;
