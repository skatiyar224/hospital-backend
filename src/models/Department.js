/**
 * Department.js
 * ------------------------------------------------------------------
 * A clinical department (Cardiology, Pediatrics...). `icon` is a key the
 * frontend maps to an icon; `services` is a short bullet list shown on
 * the department page. `displayOrder` controls listing order.
 * ------------------------------------------------------------------
 */
const mongoose = require('mongoose');
const slugify = require('slugify');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Department name is required'], trim: true, unique: true, maxlength: 60 },
    slug: { type: String, unique: true, lowercase: true, index: true },
    shortDescription: { type: String, trim: true, maxlength: 200, default: '' },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    icon: { type: String, trim: true, default: 'stethoscope' },
    image: { type: String, default: null },
    services: { type: [String], default: [] },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

departmentSchema.pre('validate', function generateSlug(next) {
  if (this.name && (this.isNew || this.isModified('name'))) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Department', departmentSchema);
