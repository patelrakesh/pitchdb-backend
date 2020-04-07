const { body } = require('express-validator/check');

const bodyExists = body().not().isEmpty();

module.exports = {
  postBundle: [
    bodyExists
  ]
}