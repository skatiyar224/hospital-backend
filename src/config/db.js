/**
 * db.js
 * ------------------------------------------------------------------
 * Establishes and manages the MongoDB connection via Mongoose.
 * Kept separate from server.js so the connection logic (retries,
 * event listeners, graceful shutdown) is easy to find and extend.
 * ------------------------------------------------------------------
 */

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      // Mongoose 8+ no longer needs useNewUrlParser/useUnifiedTopology,
      // they are kept here (commented) as a reminder for older drivers.
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`);
});

// Graceful shutdown on process termination signals.
const gracefulExit = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed due to app termination');
  process.exit(0);
};

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

module.exports = connectDB;
