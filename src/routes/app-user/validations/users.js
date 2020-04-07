const { body, param } = require('express-validator/check');
const networkConstants = require('../../../modules/users/constants/networks');

const networks = [
  networkConstants.FACEBOOK,
  networkConstants.GOOGLE,
  networkConstants.LINKEDIN,
  networkConstants.MICROSOFT
];

const networkCheck = param('network', 'Invalid netowork value').isIn(networks);
const bodyIsNotempty = body().not().isEmpty();

const passwordRegex = body('newPassword', 'Invalid password').custom((value) => {
  const passwordRegex = RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/);
  const regexTest = passwordRegex.test(value);
  if (!regexTest) throw new Error('Your password is too weak');
  else return true;
});

module.exports = {
  putSocialLoginByNetwork: [
    networkCheck,
    bodyIsNotempty
  ],
  putMePassword: [
    passwordRegex
  ]
}