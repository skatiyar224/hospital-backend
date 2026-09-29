/**
 * logger.js
 * ------------------------------------------------------------------
 * Minimal dependency-free logger with timestamped, leveled output.
 * Swap this out for Winston/Pino later without touching call sites,
 * since every other file only calls logger.info/warn/error/debug.
 * ------------------------------------------------------------------
 */

const env = require('../config/env');

const timestamp = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`[INFO]  ${timestamp()} -`, ...args),
  warn: (...args) => console.warn(`[WARN]  ${timestamp()} -`, ...args),
  error: (...args) => console.error(`[ERROR] ${timestamp()} -`, ...args),
  debug: (...args) => {
    if (env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${timestamp()} -`, ...args);
    }
  },
};

module.exports = logger;
