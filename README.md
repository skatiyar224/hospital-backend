# Hospital Backend (MERN)

Express + MongoDB API for a hospital website. Serves **two frontends** from one backend:

1. **Patient website** — departments, doctors, slot-based appointment booking, patient profile → `/api/v1/**`
2. **Admin panel** — dashboard, departments, doctors & schedules, appointments, patients, contact inbox → `/api/v1/admin/**` (JWT + admin role, enforced once in `routes/admin/index.js`)

Interactive docs: **`/api-docs`** (Swagger UI) · raw spec: `/api-docs.json` · health: `/health`

## Run

```bash
npm install
cp .env.example .env     # set MONGO_URI and long random JWT secrets
npm run seed             # admin + 8 departments + 12 doctors with schedules
npm run dev              # http://localhost:5000
```

Seeded admin: `admin@hospital.com` / `Admin@12345` (**change it**).

## Folder structure

```
src/
├── config/        env, db, swagger
├── models/        User, Department, Doctor, Appointment, ContactMessage
├── validations/   express-validator rule sets (one file per resource)
├── middlewares/   auth (protect/authorize), validate, error, upload, rateLimiter, parseJsonFields
├── controllers/   auth, user, department, doctor, appointment, contact, stats, admin.*
├── routes/
│   ├── public/    -> /api/v1/**        (patient website)
│   └── admin/     -> /api/v1/admin/**  (admin panel)
├── utils/         apiError, apiResponse, asyncHandler, generateToken, logger,
│                  hospitalTime, slots, pagination
└── seed/seed.js
```

## How appointment booking works

**Slots are computed, not stored.** A doctor has recurring weekly `availability` windows
(`dayOfWeek`, `startTime`, `endTime`, `slotDurationMinutes`). `GET /doctors/:id/slots?date=` expands the window for
that weekday into slot times and flags each `available` or not (already booked, or already past today). Editing a
schedule needs no data migration.

**Dates are strings in the hospital timezone.** `appointmentDate` is `YYYY-MM-DD` and `timeSlot` is `HH:mm`, interpreted in
`HOSPITAL_TIMEZONE` (default `Asia/Kolkata`) regardless of the server's timezone. This avoids off-by-one-day bugs.

**Double-booking is prevented by the database.** Each live appointment stores `slotKey = doctor_date_time`
under a *unique sparse index*; cancelling **unsets** it, freeing the slot. Two simultaneous requests for one slot →
one succeeds, the other gets `409 Slot just taken`. Application-level checks alone can't guarantee that.

`POST /appointments` also rejects: past times, dates beyond `BOOKING_WINDOW_DAYS`, doctors who are inactive or not
accepting appointments, times outside the doctor's schedule, and a patient already having a live appointment at that
date+time.

**Status lifecycle** (admin, `PATCH /admin/appointments/:id/status`):

```
pending   -> confirmed | cancelled
confirmed -> completed | cancelled | no_show
completed / cancelled / no_show -> (final)
```
Future visits can't be marked `completed`/`no_show`. Patients can cancel pending/confirmed appointments until
`CANCELLATION_CUTOFF_HOURS` (default 2) before the visit; after that they must call the hospital.

Payment is **pay at hospital** (the fee is snapshotted on the appointment). To add online payment later, add a value to
`Appointment.paymentMethod`, a `paymentStatus` field, and a webhook route — existing appointments are unaffected.

## Notes for the admin panel

- `POST/PUT /admin/doctors` and `/admin/departments` are `multipart/form-data`; send `availability`, `qualifications`,
  `languages`, `services` as **JSON strings** (parsed by `parseJsonFields` before validation).
- Deactivating a doctor is blocked while they have upcoming pending/confirmed appointments; deleting a department is
  blocked while active doctors belong to it.
- Changing a doctor's schedule does **not** touch appointments already booked in slots that no longer exist —
  review those on the Appointments screen.

## Security & scale notes

JWT access + rotating httpOnly refresh cookie · bcrypt(12) · helmet · CORS allow-list for the two frontends ·
NoSQL-injection sanitising · rate limits (tighter on auth and the contact form) · user text is regex-escaped before
searching · pagination on every list · indexes on doctor+date, date+time, status, patient.
For production, move uploads to S3/Cloudinary (`upload.middleware.js` is the only file to change).
