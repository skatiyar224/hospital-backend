/**
 * admin.patient.controller.js - admin view of patient accounts.
 */
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../utils/pagination');

/** @route GET /api/v1/admin/patients */
const listPatients = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { role: 'patient' };
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q.trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [patients, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  sendSuccess(res, 200, 'Patients fetched', { patients }, buildMeta(page, limit, total));
});

/** @route GET /api/v1/admin/patients/:id  - profile + recent appointments */
const getPatient = asyncHandler(async (req, res) => {
  const patient = await User.findOne({ _id: req.params.id, role: 'patient' });
  if (!patient) throw ApiError.notFound('Patient not found');
  const [appointments, appointmentCount] = await Promise.all([
    Appointment.find({ patient: patient._id }).sort({ appointmentDate: -1, timeSlot: -1 }).limit(10)
      .populate('doctor', 'name').populate('department', 'name'),
    Appointment.countDocuments({ patient: patient._id }),
  ]);
  sendSuccess(res, 200, 'Patient fetched', { patient: patient.toSafeObject(), appointments, appointmentCount });
});

/** @route PATCH /api/v1/admin/patients/:id/status */
const setPatientActive = asyncHandler(async (req, res) => {
  const patient = await User.findOne({ _id: req.params.id, role: 'patient' });
  if (!patient) throw ApiError.notFound('Patient not found');
  patient.isActive = req.body.isActive;
  await patient.save();
  sendSuccess(res, 200, `Patient ${patient.isActive ? 'activated' : 'deactivated'}`, { patient: patient.toSafeObject() });
});

module.exports = { listPatients, getPatient, setPatientActive };
