/**
 * Appointment.js
 * ------------------------------------------------------------------
 * `appointmentDate` ('YYYY-MM-DD') and `timeSlot` ('HH:mm') are plain
 * strings in the hospital's timezone — avoids the classic off-by-one-day
 * bugs of storing local dates as UTC Date objects.
 *
 * DOUBLE-BOOKING PROTECTION: `slotKey` = "<doctorId>_<date>_<time>" has a
 * unique sparse index. It is set while the appointment holds the slot and
 * UNSET when cancelled, freeing the slot. The database — not application
 * code — guarantees two patients can never hold the same slot, even under
 * concurrent requests.
 * ------------------------------------------------------------------
 */
const mongoose = require('mongoose');

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

const appointmentSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // human-friendly, e.g. APT-7K2QX9
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },

    appointmentDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    timeSlot: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    slotKey: { type: String, unique: true, sparse: true },

    // Snapshot of who the visit is for (patient may book for a relative).
    patientName: { type: String, required: true, trim: true },
    patientPhone: { type: String, required: true, trim: true },
    patientAge: { type: Number, min: 0, max: 120, default: null },
    patientGender: { type: String, enum: ['male', 'female', 'other'], default: undefined },

    reason: { type: String, trim: true, maxlength: 500, default: '' },
    consultationFee: { type: Number, required: true, min: 0 }, // snapshot at booking time
    paymentMethod: { type: String, enum: ['pay_at_hospital'], default: 'pay_at_hospital' },

    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    adminNotes: { type: String, trim: true, maxlength: 1000, default: '' },
    cancelReason: { type: String, trim: true, maxlength: 300, default: '' },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, enum: ['patient', 'admin'], default: undefined },
  },
  { timestamps: true }
);

appointmentSchema.pre('validate', function assignCode(next) {
  if (this.isNew && !this.code) {
    this.code = 'APT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  next();
});

appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, timeSlot: 1 });

appointmentSchema.statics.STATUSES = STATUSES;
appointmentSchema.statics.buildSlotKey = (doctorId, date, time) => `${doctorId}_${date}_${time}`;

module.exports = mongoose.model('Appointment', appointmentSchema);
