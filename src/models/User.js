/**
 * User.js
 * ------------------------------------------------------------------
 * Patients and admins share one collection (differentiated by `role`).
 * Patients carry a small medical profile that pre-fills booking forms.
 * ------------------------------------------------------------------
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'], index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true, default: null },
    avatar: { type: String, default: null },
    role: { type: String, enum: ['patient', 'admin'], default: 'patient' },

    // Patient profile (all optional)
    gender: { type: String, enum: ['male', 'female', 'other'], default: undefined },
    dateOfBirth: { type: String, default: null }, // 'YYYY-MM-DD'
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], default: undefined },
    address: { type: String, trim: true, maxlength: 300, default: '' },
    emergencyContact: {
      name: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      relation: { type: String, trim: true, default: '' },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(12));
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
