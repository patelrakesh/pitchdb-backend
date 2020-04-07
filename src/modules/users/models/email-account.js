const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let emailAccount = new mongoose.Schema({
  email: { type: String, required: false },
  network: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  emailToken: { type: String, required: false },
  emailRefreshToken: { type: String, required: false },
  tokenExpiration: { type: Date, required: false },
  date: { type: Date, default: Date.now },
  activationDate: { type: Date, default: Date.now },
  invalid: { type: Boolean }
});

module.exports = mongoose.model('emailAccount', emailAccount, 'emailAccounts');