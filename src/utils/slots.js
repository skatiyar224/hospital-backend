/**
 * slots.js
 * ------------------------------------------------------------------
 * Turns a doctor's recurring weekly availability into concrete
 * 'HH:mm' start times for one calendar date. Slots are never stored —
 * only booked appointments are — so editing a schedule needs no migration.
 * ------------------------------------------------------------------
 */
const { dayOfWeek } = require('./hospitalTime');

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHmm = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

/**
 * @param {Array} availability - doctor.availability entries
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string[]} sorted, de-duplicated slot start times
 */
const generateSlotsForDate = (availability = [], dateStr) => {
  const day = dayOfWeek(dateStr);
  const slots = new Set();

  availability
    .filter((entry) => entry.dayOfWeek === day)
    .forEach((entry) => {
      const step = entry.slotDurationMinutes || 30;
      const end = toMinutes(entry.endTime);
      for (let t = toMinutes(entry.startTime); t + step <= end; t += step) slots.add(toHHmm(t));
    });

  return [...slots].sort();
};

module.exports = { generateSlotsForDate, toMinutes, toHHmm };
