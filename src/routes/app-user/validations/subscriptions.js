const { body } = require('express-validator/check');

const tokenHasId = body('token.id').not().isEmpty();

module.exports = {
  post: [
    tokenHasId
  ]
}