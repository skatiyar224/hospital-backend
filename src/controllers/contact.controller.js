/**
 * contact.controller.js - public contact form + admin inbox.
 */
const ContactMessage = require('../models/ContactMessage');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../utils/pagination');

/** @route POST /api/v1/contact */
const submitMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  await ContactMessage.create({ name, email, phone, subject, message });
  sendSuccess(res, 201, 'Thank you. Our team will get back to you soon.', null);
});

/** @route GET /api/v1/admin/messages */
const listMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q.trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { subject: rx }];
  }
  const [messages, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactMessage.countDocuments(filter),
  ]);
  sendSuccess(res, 200, 'Messages fetched', { messages }, buildMeta(page, limit, total));
});

/** @route PATCH /api/v1/admin/messages/:id */
const updateMessageStatus = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!message) throw ApiError.notFound('Message not found');
  sendSuccess(res, 200, 'Message updated', { message });
});

/** @route DELETE /api/v1/admin/messages/:id */
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) throw ApiError.notFound('Message not found');
  sendSuccess(res, 200, 'Message deleted', null);
});

module.exports = { submitMessage, listMessages, updateMessageStatus, deleteMessage };
