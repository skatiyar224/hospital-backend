/**
 * doctor.controller.js - public directory + bookable slots, and admin CRUD.
 * Mounted at /api/v1/doctors (public) and /api/v1/admin/doctors.
 */
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../utils/pagination');
const { generateSlotsForDate } = require('../utils/slots');
const { getHospitalNow, isValidDateString, addDays } = require('../utils/hospitalTime');

const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(v);

const SORTS = {
  name: { name: 1 },
  experience: { experienceYears: -1 },
  fee_asc: { consultationFee: 1 },
  fee_desc: { consultationFee: -1 },
};

/** Builds the shared list filter for public + admin listings. */
const buildFilter = (query, { includeInactive = false } = {}) => {
  const filter = {};
  if (!includeInactive) filter.isActive = true;
  if (query.department) filter.department = query.department;
  if (query.gender) filter.gender = query.gender;
  if (query.featured === 'true') filter.isFeatured = true;
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q.trim()), 'i');
    filter.$or = [{ name: rx }, { specialization: rx }, { designation: rx }];
  }
  return filter;
};

/* ------------------------------ PUBLIC ------------------------------ */

/** @route GET /api/v1/doctors */
const listDoctors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 12, maxLimit: 50 });
  const filter = buildFilter(req.query);

  // Hide doctors whose department has been deactivated.
  const activeDepartments = await Department.find({ isActive: true }).select('_id');
  filter.department = filter.department
    ? { $in: activeDepartments.map((d) => d._id).filter((id) => String(id) === String(filter.department)) }
    : { $in: activeDepartments.map((d) => d._id) };

  const sort = SORTS[req.query.sort] || { isFeatured: -1, name: 1 };
  const [doctors, total] = await Promise.all([
    Doctor.find(filter).sort(sort).skip(skip).limit(limit).populate('department', 'name slug icon'),
    Doctor.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Doctors fetched', { doctors }, buildMeta(page, limit, total));
});

/** @route GET /api/v1/doctors/:idOrSlug */
const getDoctor = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const doctor = await Doctor.findOne({ ...(isObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug }), isActive: true })
    .populate('department', 'name slug icon');
  if (!doctor) throw ApiError.notFound('Doctor not found');
  sendSuccess(res, 200, 'Doctor fetched', { doctor });
});

/**
 * @desc   Bookable slots for one date: every slot from the doctor's
 *         schedule, flagged available/unavailable (booked or already past).
 * @route  GET /api/v1/doctors/:id/slots?date=YYYY-MM-DD
 */
const getDoctorSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!isValidDateString(date)) throw ApiError.badRequest('date must be a valid YYYY-MM-DD date');

  const now = getHospitalNow();
  const lastBookable = addDays(now.date, env.BOOKING_WINDOW_DAYS);
  if (date < now.date) throw ApiError.badRequest('Cannot view slots for a past date');
  if (date > lastBookable) throw ApiError.badRequest(`Appointments can only be booked up to ${env.BOOKING_WINDOW_DAYS} days ahead`);

  const doctor = await Doctor.findOne({ _id: req.params.id, isActive: true });
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const allSlots = generateSlotsForDate(doctor.availability, date);

  // Slots held by any non-cancelled appointment (slotKey is unset on cancel).
  const booked = await Appointment.find({ doctor: doctor._id, appointmentDate: date, slotKey: { $exists: true } }).select('timeSlot');
  const bookedSet = new Set(booked.map((a) => a.timeSlot));

  const slots = allSlots.map((time) => ({
    time,
    available:
      doctor.isAcceptingAppointments && !bookedSet.has(time) && !(date === now.date && time <= now.time),
  }));

  sendSuccess(res, 200, 'Slots fetched', {
    date,
    isWorkingDay: allSlots.length > 0,
    isAcceptingAppointments: doctor.isAcceptingAppointments,
    slots,
  });
});

/* ------------------------------ ADMIN ------------------------------- */

/** @route GET /api/v1/admin/doctors */
const listDoctorsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildFilter(req.query, { includeInactive: true });
  const [doctors, total] = await Promise.all([
    Doctor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('department', 'name slug'),
    Doctor.countDocuments(filter),
  ]);
  sendSuccess(res, 200, 'Doctors fetched', { doctors }, buildMeta(page, limit, total));
});

/** @route POST /api/v1/admin/doctors */
const createDoctor = asyncHandler(async (req, res) => {
  if (!(await Department.exists({ _id: req.body.department }))) throw ApiError.badRequest('Department does not exist');
  const image = req.file ? `/uploads/doctors/${req.file.filename}` : null;
  const doctor = await Doctor.create({ ...req.body, image });
  sendSuccess(res, 201, 'Doctor created', { doctor });
});

/** @route PUT /api/v1/admin/doctors/:id */
const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw ApiError.notFound('Doctor not found');
  if (req.body.department && !(await Department.exists({ _id: req.body.department }))) {
    throw ApiError.badRequest('Department does not exist');
  }
  if (req.file) req.body.image = `/uploads/doctors/${req.file.filename}`;
  Object.assign(doctor, req.body);
  await doctor.save();
  sendSuccess(res, 200, 'Doctor updated', { doctor });
});

/**
 * @desc   Deactivate a doctor (soft delete). Blocked while the doctor still
 *         has upcoming pending/confirmed appointments.
 * @route  DELETE /api/v1/admin/doctors/:id
 */
const deactivateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const upcoming = await Appointment.countDocuments({
    doctor: doctor._id,
    status: { $in: ['pending', 'confirmed'] },
    appointmentDate: { $gte: getHospitalNow().date },
  });
  if (upcoming > 0) {
    throw ApiError.badRequest(`Cannot deactivate: ${upcoming} upcoming appointment(s). Complete or cancel them first.`);
  }

  doctor.isActive = false;
  await doctor.save();
  sendSuccess(res, 200, 'Doctor deactivated', null);
});

module.exports = { listDoctors, getDoctor, getDoctorSlots, listDoctorsAdmin, createDoctor, updateDoctor, deactivateDoctor };
