const { body } = require('express-validator/check');

const invitationFieldsExist = body('team', 'email').not().isEmpty();

module.exports = {
  postInvitation: [
    invitationFieldsExist
  ]
}