const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Run after express-validator chains to collect and throw formatted errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => `${e.path}: ${e.msg}`);
    throw new ApiError(400, 'Validation failed', formatted);
  }
  next();
};

module.exports = validate;
