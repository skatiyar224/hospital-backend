/**
 * department.controller.js - public listing + admin CRUD.
 * Mounted at /api/v1/departments (public) and /api/v1/admin/departments.
 */
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(v);

/* ------------------------------ PUBLIC ------------------------------ */

/** @route GET /api/v1/departments  - active departments with doctor counts */
const listDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).lean();

  const counts = await Doctor.aggregate([
    { $match: { isActive: true, department: { $in: departments.map((d) => d._id) } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  departments.forEach((d) => { d.doctorCount = countMap[String(d._id)] || 0; });

  sendSuccess(res, 200, 'Departments fetched', { departments });
});

/** @route GET /api/v1/departments/:idOrSlug */
const getDepartment = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const department = await Department.findOne({ ...(isObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug }), isActive: true });
  if (!department) throw ApiError.notFound('Department not found');
  sendSuccess(res, 200, 'Department fetched', { department });
});

/* ------------------------------ ADMIN ------------------------------- */

/** @route GET /api/v1/admin/departments */
const listDepartmentsAdmin = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ displayOrder: 1, name: 1 });
  sendSuccess(res, 200, 'Departments fetched', { departments });
});

/** @route POST /api/v1/admin/departments */
const createDepartment = asyncHandler(async (req, res) => {
  const image = req.file ? `/uploads/departments/${req.file.filename}` : null;
  const department = await Department.create({ ...req.body, image });
  sendSuccess(res, 201, 'Department created', { department });
});

/** @route PUT /api/v1/admin/departments/:id */
const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');
  if (req.file) req.body.image = `/uploads/departments/${req.file.filename}`;
  Object.assign(department, req.body);
  await department.save();
  sendSuccess(res, 200, 'Department updated', { department });
});

/** @route DELETE /api/v1/admin/departments/:id  (blocked while doctors are assigned) */
const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');
  const doctors = await Doctor.countDocuments({ department: department._id, isActive: true });
  if (doctors > 0) {
    throw ApiError.badRequest(`Cannot delete: ${doctors} active doctor(s) belong to this department. Reassign or deactivate them first.`);
  }
  await department.deleteOne();
  sendSuccess(res, 200, 'Department deleted', null);
});

module.exports = { listDepartments, getDepartment, listDepartmentsAdmin, createDepartment, updateDepartment, deleteDepartment };
