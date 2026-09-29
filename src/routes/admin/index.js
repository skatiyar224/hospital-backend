/**
 * routes/admin/index.js - /api/v1/admin/**
 * protect + authorize('admin') is applied ONCE here, so every admin route
 * below is guaranteed to be reachable only by an authenticated admin.
 */
const router = require('express').Router();
const { protect, authorize } = require('../../middlewares/auth.middleware');

router.use(protect, authorize('admin'));

router.use('/dashboard', require('./admin.dashboard.routes'));
router.use('/departments', require('./admin.department.routes'));
router.use('/doctors', require('./admin.doctor.routes'));
router.use('/appointments', require('./admin.appointment.routes'));
router.use('/patients', require('./admin.patient.routes'));
router.use('/messages', require('./admin.message.routes'));

module.exports = router;
