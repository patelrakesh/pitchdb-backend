const { validationResult } = require('express-validator/check');

module.exports = (req, res, err, data, next) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }
  else if (err) {
    next(err)
  }
  else
    res.send(data);
}