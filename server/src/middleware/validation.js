const { validationResult } = require("express-validator");

function handleValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((e) => ({
    field: e.param,
    message: e.msg,
  }));

  return res.status(400).json({
    success: false,
    error: "Validation failed.",
    details: errors,
  });
}

module.exports = {
  handleValidationErrors,
};

