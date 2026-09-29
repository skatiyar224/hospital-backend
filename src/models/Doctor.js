/**
 * Doctor.js
 * ------------------------------------------------------------------
 * Public doctor profile + weekly schedule. `availability` entries are
 * recurring weekly windows; concrete bookable slots are generated from
 * them on demand (see utils/slots.js) rather than stored, so changing a
 * schedule never requires migrating slot documents.
 * ------------------------------------------------------------------
 */
const mongoose = require('mongoose');
const slugify = require('slugify');

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const availabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday
    startTime: { type: String, required: true, match: [TIME_RE, 'startTime must be HH:mm'] },
    endTime: { type: String, required: true, match: [TIME_RE, 'endTime must be HH:mm'] },
    slotDurationMinutes: { type: Number, default: 30, min: 10, max: 120 },
  },
  { _id: false }
);

availabilitySchema.pre('validate', function checkRange(next) {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    this.invalidate('endTime', 'endTime must be after startTime');
  }
  next();
});

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Doctor name is required'], trim: true, maxlength: 80, index: true },
    slug: { type: String, unique: true, lowercase: true, index: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: [true, 'Department is required'], index: true },
    designation: { type: String, trim: true, default: 'Consultant' },
    specialization: { type: String, trim: true, default: '' },
    qualifications: { type: [String], default: [] },
    experienceYears: { type: Number, min: 0, max: 70, default: 0 },
    gender: { type: String, enum: ['male', 'female', 'other'], default: undefined },
    languages: { type: [String], default: [] },
    bio: { type: String, trim: true, maxlength: 3000, default: '' },
    image: { type: String, default: null },
    consultationFee: { type: Number, required: [true, 'Consultation fee is required'], min: 0 },
    availability: { type: [availabilitySchema], default: [] },
    isFeatured: { type: Boolean, default: false },
    isAcceptingAppointments: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorSchema.pre('validate', function generateSlug(next) {
  if (this.name && (this.isNew || this.isModified('name'))) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Math.random().toString(36).slice(2, 6);
  }
  next();
});

doctorSchema.index({ name: 'text', specialization: 'text', bio: 'text' });
doctorSchema.index({ department: 1, isActive: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
