const { body } = require('express-validator/check');

const bodyIsNotempty = body().not().isEmpty();

module.exports = {
  postLoginByNetwork: [
    bodyIsNotempty
  ],
  postLogin: [
    bodyIsNotempty
  ]
}