/** pagination.js - shared page/limit parsing and response meta. */
const getPagination = (query, { defaultLimit = 10, maxLimit = 100 } = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

const buildMeta = (page, limit, totalResults) => ({
  page,
  limit,
  totalPages: Math.ceil(totalResults / limit) || 1,
  totalResults,
});

/** Escapes user input before embedding it in a RegExp (prevents ReDoS/injection). */
const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { getPagination, buildMeta, escapeRegex };
