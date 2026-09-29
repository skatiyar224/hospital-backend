/** ContactMessage.js - messages submitted via the public Contact form. */
const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ['new', 'in_progress', 'resolved'], default: 'new', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
