/**
 * app.js
 * ------------------------------------------------------------------
 * Builds and configures the Express application. Kept separate from
 * server.js so the app instance can be imported directly in tests
 * (e.g. with supertest) without actually binding to a port.
 *
 * Middleware pipeline (order matters):
 *   security headers -> CORS -> body/cookie parsing -> sanitization
 *   -> logging -> rate limiting -> static uploads -> Swagger UI
 *   -> API routes -> 404 handler -> global error handler
 * ------------------------------------------------------------------
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');

const app = express();

// Trust the first proxy hop (needed for correct client IPs / secure
// cookies when deployed behind a load balancer like Nginx/Heroku/Render).
app.set('trust proxy', 1);

/* ------------------------------ Security ------------------------------ */
// crossOriginResourcePolicy relaxed so the storefront/admin (other origins)
// can load images from /uploads. CORS still restricts API access.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = [env.CLIENT_URL, env.ADMIN_CLIENT_URL];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl/Postman) which send no origin.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true, // required so the refreshToken cookie is sent/received
  })
);

/* ------------------------------ Parsing -------------------------------- */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips any $ / . operators from user input (NoSQL injection guard)

/* ------------------------------ Logging -------------------------------- */
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

/* --------------------------- Rate limiting ------------------------------ */
app.use(`/api/${env.API_VERSION}`, apiLimiter);

/* ------------------------- Static file serving --------------------------- */
// Serves uploaded doctor/department/avatar images, e.g. /uploads/doctors/xyz.jpg
app.use(`/${env.UPLOAD_DIR}`, express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

/* ------------------------------ API docs -------------------------------- */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Hospital API Docs' }));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

/* -------------------------------- Health --------------------------------- */
app.get('/health', (req, res) => res.status(200).json({ success: true, message: 'Server is healthy' }));

/* -------------------------------- Routes ---------------------------------- */
app.use(`/api/${env.API_VERSION}`, routes);

/* --------------------------- Error handling -------------------------------- */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
