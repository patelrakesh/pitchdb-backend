/* eslint-disable linebreak-style */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let user = new Schema({
  email: { type: String, required: true, unique: true },
  signupEmail: { type: String, required: false },
  name: { type: String, required: true },
  network: { type: String, required: false },
  signupNetwork: { type: String, required: false },
  role: { type: String, required: false },
  teamId: { type: String, required: false },
  stripeCustomerId: { type: String, required: false },
  onboard: { type: Boolean, default: false },
  dateRegistration: { type: Date, required: true, default: Date.now },
  dateLastLogin: { type: Date, required: false },
  privileges: { type: [String], required: false },
  firstLogin: { type: Boolean, required: false, default: false },
  paperform: { type: Boolean },
  disabled: {type: Boolean, required: false, default: false},
  jwtToken: {type:String},
  addedPrivileges: {type: [String], required: false},
  detail: {
    _id: false,
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    phone: { type: String, required: false },
    company: { type: String, required: false },
    website: { type: String, required: false },
    productOrService: { type: String, required: false },
    featuredMedia: { type: [String], required: false },
    mediaKit: { type: [String], required: false },
    mediaProducts: { type: [String], required: false },
    reachoutContacts: { type: [String], required: false },
    isAuthor: { type: String, required: false },
    publishHelp: { type: [String], required: false },
    submissionId: { type: String, required: false }
  }
});

module.exports = mongoose.model('user', user);