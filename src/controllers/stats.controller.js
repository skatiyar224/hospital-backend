/**
 * stats.controller.js - small public numbers for the home page.
 */
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/** @route GET /api/v1/stats */
const getPublicStats = asyncHandler(async (req, res) => {
  const [doctors, departments, patients, appointmentsCompleted] = await Promise.all([
    Doctor.countDocuments({ isActive: true }),
    Department.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'patient' }),
    Appointment.countDocuments({ status: 'completed' }),
  ]);
  sendSuccess(res, 200, 'Stats fetched', { doctors, departments, patients, appointmentsCompleted });
});

module.exports = { getPublicStats };
