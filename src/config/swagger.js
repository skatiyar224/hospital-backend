/**
 * swagger.js
 * ------------------------------------------------------------------
 * OpenAPI 3 spec built from the @swagger JSDoc blocks in src/routes/**.
 * Shared data shapes live here under components.schemas.
 *   Interactive UI: GET /api-docs      Raw JSON: GET /api-docs.json
 * ------------------------------------------------------------------
 */
const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const err = (description) => ({ description, content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } });

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Hospital Backend API',
      version: '1.0.0',
      description:
        'REST API for a hospital website: departments, doctors, slot-based appointment booking, patient accounts, ' +
        'and a separate admin namespace (/api/v1/admin/**). Auth: short-lived JWT access token (Bearer header) + httpOnly refresh cookie. ' +
        `Appointment dates/times are plain strings in the hospital timezone (${env.HOSPITAL_TIMEZONE}).`,
    },
    servers: [{ url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`, description: 'Local development' }],
    tags: [
      { name: 'Auth', description: 'Registration, login, tokens' },
      { name: 'Users', description: 'Patient profile' },
      { name: 'Departments', description: 'Public department listing' },
      { name: 'Doctors', description: 'Public doctor directory and bookable slots' },
      { name: 'Appointments', description: 'Patient booking and history' },
      { name: 'Contact', description: 'Contact form' },
      { name: 'Stats', description: 'Home page numbers' },
      { name: 'Admin - Dashboard' }, { name: 'Admin - Departments' }, { name: 'Admin - Doctors' },
      { name: 'Admin - Appointments' }, { name: 'Admin - Patients' }, { name: 'Admin - Messages' },
    ],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: {
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
          },
        },
        ApiSuccess: {
          type: 'object',
          properties: { success: { type: 'boolean', example: true }, message: { type: 'string' }, data: { type: 'object' }, meta: { $ref: '#/components/schemas/Pagination' } },
        },
        Pagination: {
          type: 'object',
          properties: { page: { type: 'integer' }, limit: { type: 'integer' }, totalPages: { type: 'integer' }, totalResults: { type: 'integer' } },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' },
            role: { type: 'string', enum: ['patient', 'admin'] }, gender: { type: 'string' }, dateOfBirth: { type: 'string', example: '1990-04-21' },
            bloodGroup: { type: 'string', example: 'O+' }, address: { type: 'string' }, isActive: { type: 'boolean' },
          },
        },
        Department: {
          type: 'object',
          properties: {
            _id: { type: 'string' }, name: { type: 'string', example: 'Cardiology' }, slug: { type: 'string' },
            shortDescription: { type: 'string' }, description: { type: 'string' }, icon: { type: 'string', example: 'heart' },
            image: { type: 'string' }, services: { type: 'array', items: { type: 'string' } }, doctorCount: { type: 'integer' }, isActive: { type: 'boolean' },
          },
        },
        Availability: {
          type: 'object',
          properties: {
            dayOfWeek: { type: 'integer', minimum: 0, maximum: 6, description: '0 = Sunday' },
            startTime: { type: 'string', example: '09:00' }, endTime: { type: 'string', example: '13:00' },
            slotDurationMinutes: { type: 'integer', example: 30 },
          },
        },
        Doctor: {
          type: 'object',
          properties: {
            _id: { type: 'string' }, name: { type: 'string' }, slug: { type: 'string' }, department: { type: 'string' },
            designation: { type: 'string' }, specialization: { type: 'string' }, qualifications: { type: 'array', items: { type: 'string' } },
            experienceYears: { type: 'integer' }, languages: { type: 'array', items: { type: 'string' } }, bio: { type: 'string' },
            consultationFee: { type: 'number' }, availability: { type: 'array', items: { $ref: '#/components/schemas/Availability' } },
            isFeatured: { type: 'boolean' }, isAcceptingAppointments: { type: 'boolean' }, isActive: { type: 'boolean' },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            _id: { type: 'string' }, code: { type: 'string', example: 'APT-7K2QX9' }, patient: { type: 'string' }, doctor: { type: 'string' },
            department: { type: 'string' }, appointmentDate: { type: 'string', example: '2026-10-05' }, timeSlot: { type: 'string', example: '10:30' },
            patientName: { type: 'string' }, patientPhone: { type: 'string' }, reason: { type: 'string' }, consultationFee: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'] },
          },
        },
      },
      responses: {
        UnauthorizedError: err('Missing or invalid access token'),
        ForbiddenError: err('Authenticated but not permitted'),
        NotFoundError: err('Resource not found'),
        ValidationError: err('Request failed validation'),
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/**/*.js', './src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
