const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userEventOrganization = new Schema({
  userId: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
  eventOrganizationId: { type: String, required: true },
  eventOrganization: { type: Object, required: true },
  date: { type: Date, default: Date.now },
  connected: { type: Boolean, default: false },
  oldUser: { type: String, default: 'none' }
});

userEventOrganization.index({ userId: 1, eventOrganizationId: 1, oldUser: 1 }, { unique: true });

module.exports = mongoose.model('userEventOrganization', userEventOrganization, 'userEventOrganizations');