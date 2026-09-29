/**
 * admin.dashboard.controller.js - overview numbers for the admin home.
 */
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const ContactMessage = require('../models/ContactMessage');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getHospitalNow, addDays } = require('../utils/hospitalTime');

/** @route GET /api/v1/admin/dashboard */
const getDashboardStats = asyncHandler(async (req, res) => {
  const today = getHospitalNow().date;
  const weekEnd = addDays(today, 6);

  const [patients, doctors, departments, totalAppointments, todaysAppointments, statusAgg, weekAgg, newMessages] =
    await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: true }),
      Appointment.countDocuments(),
      Appointment.find({ appointmentDate: today, status: { $ne: 'cancelled' } })
        .sort({ timeSlot: 1 })
        .populate('doctor', 'name')
        .populate('department', 'name')
        .populate('patient', 'name phone'),
      Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Appointment.aggregate([
        { $match: { appointmentDate: { $gte: today, $lte: weekEnd }, status: { $in: ['pending', 'confirmed'] } } },
        { $group: { _id: '$appointmentDate', count: { $sum: 1 } } },
      ]),
      ContactMessage.countDocuments({ status: 'new' }),
    ]);

  const statusCounts = Object.fromEntries(statusAgg.map((s) => [s._id, s.count]));
  const weekMap = Object.fromEntries(weekAgg.map((d) => [d._id, d.count]));
  const nextSevenDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i);
    return { date, count: weekMap[date] || 0 };
  });

  sendSuccess(res, 200, 'Dashboard stats fetched', {
    today,
    patients,
    doctors,
    departments,
    totalAppointments,
    pendingAppointments: statusCounts.pending || 0,
    statusCounts,
    todaysAppointments,
    nextSevenDays,
    newMessages,
  });
});

module.exports = { getDashboardStats };
