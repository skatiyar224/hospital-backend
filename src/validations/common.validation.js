const { param } = require('express-validator');

/** Reusable ":id must be a Mongo ObjectId" rule. */
const idParam = (name = 'id') => [param(name).isMongoId().withMessage(`Invalid ${name}`)];

module.exports = { idParam };
