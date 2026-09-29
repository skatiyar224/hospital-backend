/**
 * hospitalTime.js
 * ------------------------------------------------------------------
 * All appointment logic works with plain 'YYYY-MM-DD' / 'HH:mm' strings
 * in the hospital's timezone (env.HOSPITAL_TIMEZONE). These helpers
 * compute "now" in that timezone and do calendar math without ever
 * depending on the server's own timezone.
 * ------------------------------------------------------------------
 */
const env = require('../config/env');

/** Current { date: 'YYYY-MM-DD', time: 'HH:mm' } in the hospital timezone. */
const getHospitalNow = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: env.HOSPITAL_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
};

/** True for a real calendar date in 'YYYY-MM-DD' form (rejects 2026-02-31). */
const isValidDateString = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

/** 0 (Sunday) - 6 (Saturday) for a 'YYYY-MM-DD' string. */
const dayOfWeek = (dateStr) => new Date(`${dateStr}T00:00:00Z`).getUTCDay();

const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Milliseconds from hospital-now until the given slot (negative = past). */
const msUntilSlot = (date, time) => {
  const now = getHospitalNow();
  const slot = Date.parse(`${date}T${time}:00Z`);
  const current = Date.parse(`${now.date}T${now.time}:00Z`);
  return slot - current;
};

module.exports = { getHospitalNow, isValidDateString, dayOfWeek, addDays, msUntilSlot };
