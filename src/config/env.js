/**
 * env.js
 * ------------------------------------------------------------------
 * Loads environment variables from .env and exposes them as a single
 * typed config object so the rest of the app never touches
 * `process.env` directly. This makes it trivial to see, at a glance,
 * every environment variable the backend depends on.
 * ------------------------------------------------------------------
 */

const dotenv = require('dotenv');
dotenv.config();

const requiredInProduction = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  API_VERSION: process.env.API_VERSION || 'v1',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ADMIN_CLIENT_URL: process.env.ADMIN_CLIENT_URL || 'http://localhost:5174',

  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_db',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  JWT_COOKIE_EXPIRES_DAYS: Number(process.env.JWT_COOKIE_EXPIRES_DAYS) || 7,

  RATE_LIMIT_WINDOW_MINUTES: Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15,
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  AUTH_RATE_LIMIT_MAX_REQUESTS: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 20,

  MAX_FILE_UPLOAD_MB: Number(process.env.MAX_FILE_UPLOAD_MB) || 5,
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',

  // Hospital-specific: all appointment dates/times are interpreted in this
  // timezone (IANA name), independent of where the server runs.
  HOSPITAL_TIMEZONE: process.env.HOSPITAL_TIMEZONE || 'Asia/Kolkata',
  // How many days ahead a patient may book.
  BOOKING_WINDOW_DAYS: Number(process.env.BOOKING_WINDOW_DAYS) || 60,
  // Patients cannot cancel within this many hours of the appointment.
  CANCELLATION_CUTOFF_HOURS: Number(process.env.CANCELLATION_CUTOFF_HOURS) || 2,
};

// Fail fast in production if critical secrets were left at defaults.
if (env.NODE_ENV === 'production') {
  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error(`[FATAL] Missing required environment variables in production: ${missing.join(', ')}`);
    process.exit(1);
  }
}

module.exports = env;
