const BackError = require('../models/back-error');
const winston = require('winston');

module.exports = {
    persistError: errorData => {
        let newError = new BackError(errorData);
        newError.save(err => {
            winston.error(err);
        })
    }
}