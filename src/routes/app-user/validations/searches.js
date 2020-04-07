const { body } = require('express-validator/check');

const filtersNotEmpty = body('filters').not().isEmpty();

module.exports = {
  post: [
    filtersNotEmpty
  ]
}