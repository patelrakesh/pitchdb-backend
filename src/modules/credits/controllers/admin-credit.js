/* eslint-disable linebreak-style */
const User = require('../../users/models/user');
const creditController = require('./credit');
const CustomError = require('../../common/errors/custom-error');

const adminCreditController = {
  addCredits: (userId, credits, callback) => {
    User.findById(userId, (err, user) => {
      if (err) callback(err);
      else if (!user) callback(new CustomError("User not found"), 404);
      else {
        creditController.addCredits(user._id, credits, callback)
      }
    })
  }
}

module.exports = adminCreditController;