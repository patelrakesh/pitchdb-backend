const { body } = require('express-validator/check');

const outreachSequencesisArray = body().isArray();

module.exports = {
  post: [
    outreachSequencesisArray
  ]
}