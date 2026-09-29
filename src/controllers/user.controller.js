/**
 * user.controller.js - a signed-in patient managing their own account.
 */
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const PROFILE_FIELDS = ['name', 'phone', 'gender', 'dateOfBirth', 'bloodGroup', 'address'];

/** @route PATCH /api/v1/users/me */
const updateProfile = asyncHandler(async (req, res) => {
  PROFILE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      // Empty string clears enum/optional fields instead of failing enum validation.
      req.user[field] = req.body[field] === '' ? undefined : req.body[field];
    }
  });
  // emergencyContact is a nested path: set only the keys that were sent.
  ['name', 'phone', 'relation'].forEach((key) => {
    if (req.body.emergencyContact?.[key] !== undefined) req.user.set(`emergencyContact.${key}`, req.body.emergencyContact[key]);
  });
  await req.user.save();
  sendSuccess(res, 200, 'Profile updated', { user: req.user.toSafeObject() });
});

/** @route POST /api/v1/users/me/avatar */
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image uploaded. Use the "avatar" form field.');
  req.user.avatar = `/uploads/avatars/${req.file.filename}`;
  await req.user.save();
  sendSuccess(res, 200, 'Avatar updated', { user: req.user.toSafeObject() });
});

/** @route PATCH /api/v1/users/me/password */
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect.');
  }
  user.password = req.body.newPassword;
  await user.save();
  sendSuccess(res, 200, 'Password changed successfully', null);
});

module.exports = { updateProfile, updateAvatar, changePassword };
