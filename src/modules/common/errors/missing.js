const router = require('express').Router();
const CustomError = require('./custom-error');

router.get('*', (req, res, next) => {
  next(new CustomError("Route not found", 404))
});

module.exports = router;