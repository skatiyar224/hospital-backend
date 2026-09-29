/**
 * server.js
 * ------------------------------------------------------------------
 * Entry point (`npm start` / `npm run dev`). Connects to MongoDB
 * first, then starts the HTTP server — this ordering means the app
 * never accepts a request before the DB connection is ready.
 * Also registers process-level safety nets so an unexpected error
 * crashes loudly and cleanly instead of leaving the process in a
 * half-broken state.
 * ------------------------------------------------------------------
 */

const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const logger = require('./utils/logger');

const startServer = async () => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`Swagger docs available at http://localhost:${env.PORT}/api-docs`);
  });

  // Catch promise rejections that weren't handled anywhere (e.g. a
  // stray unhandled DB error) and shut down gracefully rather than
  // continuing in an unknown state.
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
    process.exit(1);
  });
};

startServer();
