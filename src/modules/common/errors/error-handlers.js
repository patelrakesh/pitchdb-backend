const errorConstants = require('./constants');
const CustomError = require('../errors/custom-error');
const winston = require('winston');

const errorHandlers = {
  handleError: (err, req, res, next) => { // eslint-disable-line no-unused-vars
    winston.error(err);
    if (!err.status) err = new CustomError(errorConstants.UNEXPECTED);
    res.status(err.status).send(err.message);
  }
};

module.exports = errorHandlers;