/**
 * appointment.controller.js
 * ------------------------------------------------------------------
 * Patient side: book, list own, view, cancel.
 * Admin side:   list all, change status (with a strict transition map).
 *
 * BOOKING RULES enforced in createAppointment:
 *   - date is real, not in the past, within BOOKING_WINDOW_DAYS
 *   - doctor is active and accepting appointments
 *   - the time is a real slot in the doctor's schedule for that weekday
 *   - the slot is not already held (unique slotKey index — race-safe)
 *   - the patient has no other live appointment at the same date+time
 * ------------------------------------------------------------------
 */
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../utils/pagination');
const { generateSlotsForDate } = require('../utils/slots');
const { getHospitalNow, isValidDateString, addDays, msUntilSlot } = require('../utils/hospitalTime');

const POPULATE = [
  { path: 'doctor', select: 'name slug designation specialization image' },
  { path: 'department', select: 'name slug' },
];

/** Allowed admin status transitions. Terminal states have no exits. */
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
};

/** Frees the slot so someone else can book it. */
const releaseSlot = (appointment, { by, reason }) => {
  appointment.status = 'cancelled';
  appointment.slotKey = undefined; // $unset -> unique index no longer holds the slot
  appointment.cancelledAt = new Date();
  appointment.cancelledBy = by;
  appointment.cancelReason = reason || (by === 'patient' ? 'Cancelled by patient' : 'Cancelled by hospital');
};

/* ------------------------------ PATIENT ------------------------------ */

/** @route POST /api/v1/appointments */
const createAppointment = asyncHandler(async (req, res) => {
  const { doctor: doctorId, appointmentDate, timeSlot, reason, patientAge, patientGender } = req.body;

  if (!isValidDateString(appointmentDate)) throw ApiError.badRequest('appointmentDate is not a valid date');

  const now = getHospitalNow();
  if (appointmentDate < now.date || (appointmentDate === now.date && timeSlot <= now.time)) {
    throw ApiError.badRequest('That time has already passed. Please choose a future slot.');
  }
  if (appointmentDate > addDays(now.date, env.BOOKING_WINDOW_DAYS)) {
    throw ApiError.badRequest(`Appointments can only be booked up to ${env.BOOKING_WINDOW_DAYS} days ahead`);
  }

  const doctor = await Doctor.findOne({ _id: doctorId, isActive: true });
  if (!doctor) throw ApiError.notFound('Doctor not found');
  if (!doctor.isAcceptingAppointments) throw ApiError.badRequest('This doctor is not accepting appointments right now');

  if (!generateSlotsForDate(doctor.availability, appointmentDate).includes(timeSlot)) {
    throw ApiError.badRequest('The doctor does not see patients at that date and time');
  }

  const patientName = req.body.patientName || req.user.name;
  const patientPhone = req.body.patientPhone || req.user.phone;
  if (!patientPhone) throw ApiError.badRequest('A contact phone number is required to book');

  // One person cannot be in two places: block overlapping live bookings.
  const clash = await Appointment.findOne({
    patient: req.user._id, appointmentDate, timeSlot, slotKey: { $exists: true },
  });
  if (clash) throw ApiError.conflict('You already have an appointment at this date and time');

  try {
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctor._id,
      department: doctor.department,
      appointmentDate,
      timeSlot,
      slotKey: Appointment.buildSlotKey(doctor._id, appointmentDate, timeSlot),
      patientName,
      patientPhone,
      patientAge,
      patientGender,
      reason,
      consultationFee: doctor.consultationFee,
    });
    await appointment.populate(POPULATE);
    sendSuccess(res, 201, 'Appointment booked. The hospital will confirm it shortly.', { appointment });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.slotKey) {
      throw ApiError.conflict('Sorry, that slot was just taken. Please pick another time.');
    }
    throw err;
  }
});

/**
 * @route GET /api/v1/appointments?when=upcoming|past
 */
const getMyAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 10, maxLimit: 50 });
  const today = getHospitalNow().date;
  const filter = { patient: req.user._id };
  let sort = { appointmentDate: -1, timeSlot: -1 };

  if (req.query.when === 'upcoming') {
    Object.assign(filter, { appointmentDate: { $gte: today }, status: { $in: ['pending', 'confirmed'] } });
    sort = { appointmentDate: 1, timeSlot: 1 };
  } else if (req.query.when === 'past') {
    filter.$or = [
      { appointmentDate: { $lt: today } },
      { status: { $in: ['completed', 'cancelled', 'no_show'] } },
    ];
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter).sort(sort).skip(skip).limit(limit).populate(POPULATE),
    Appointment.countDocuments(filter),
  ]);
  sendSuccess(res, 200, 'Appointments fetched', { appointments }, buildMeta(page, limit, total));
});

/** @route GET /api/v1/appointments/:id */
const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate(POPULATE);
  if (!appointment) throw ApiError.notFound('Appointment not found');
  if (String(appointment.patient) !== String(req.user._id) && req.user.role !== 'admin') {
    throw ApiError.forbidden('You are not allowed to view this appointment');
  }
  sendSuccess(res, 200, 'Appointment fetched', { appointment });
});

/** @route PATCH /api/v1/appointments/:id/cancel */
const cancelMyAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw ApiError.notFound('Appointment not found');
  if (String(appointment.patient) !== String(req.user._id)) throw ApiError.forbidden('You are not allowed to cancel this appointment');

  if (!['pending', 'confirmed'].includes(appointment.status)) {
    throw ApiError.badRequest(`A ${appointment.status.replace('_', ' ')} appointment cannot be cancelled`);
  }

  const cutoffMs = env.CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;
  if (msUntilSlot(appointment.appointmentDate, appointment.timeSlot) < cutoffMs) {
    throw ApiError.badRequest(
      `Appointments can only be cancelled online at least ${env.CANCELLATION_CUTOFF_HOURS} hours before the visit. Please call the hospital.`
    );
  }

  releaseSlot(appointment, { by: 'patient', reason: req.body.cancelReason });
  await appointment.save();
  await appointment.populate(POPULATE);
  sendSuccess(res, 200, 'Appointment cancelled', { appointment });
});

/* ------------------------------- ADMIN -------------------------------- */

/** @route GET /api/v1/admin/appointments */
const listAppointmentsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, doctor, date, from, to, q } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (doctor) filter.doctor = doctor;
  if (date) filter.appointmentDate = date;
  else if (from || to) filter.appointmentDate = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  if (q) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ code: rx }, { patientName: rx }, { patientPhone: rx }];
  }

  const sort = date ? { timeSlot: 1 } : { appointmentDate: -1, timeSlot: -1 };
  const [appointments, total] = await Promise.all([
    Appointment.find(filter).sort(sort).skip(skip).limit(limit)
      .populate(POPULATE).populate('patient', 'name email phone'),
    Appointment.countDocuments(filter),
  ]);
  sendSuccess(res, 200, 'Appointments fetched', { appointments }, buildMeta(page, limit, total));
});

/** @route PATCH /api/v1/admin/appointments/:id/status */
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes, cancelReason } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw ApiError.notFound('Appointment not found');

  const allowed = TRANSITIONS[appointment.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(
      allowed.length
        ? `A ${appointment.status.replace('_', ' ')} appointment can only become: ${allowed.join(', ')}`
        : `A ${appointment.status.replace('_', ' ')} appointment can no longer be changed`
    );
  }

  // Visits that haven't happened yet cannot be marked done / missed.
  if (['completed', 'no_show'].includes(status) && appointment.appointmentDate > getHospitalNow().date) {
    throw ApiError.badRequest('A future appointment cannot be marked completed or no-show');
  }

  if (status === 'cancelled') releaseSlot(appointment, { by: 'admin', reason: cancelReason });
  else appointment.status = status;

  if (adminNotes !== undefined) appointment.adminNotes = adminNotes;
  await appointment.save();
  await appointment.populate(POPULATE);
  await appointment.populate('patient', 'name email phone');
  sendSuccess(res, 200, 'Appointment updated', { appointment });
});

module.exports = {
  createAppointment, getMyAppointments, getAppointment, cancelMyAppointment,
  listAppointmentsAdmin, updateAppointmentStatus,
};
