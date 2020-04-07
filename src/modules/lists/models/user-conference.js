const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userConference = new Schema({
  userId: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
  conferenceId: { type: String, required: true },
  conference: { type: Object, required: true },
  date: { type: Date, default: Date.now },
  connected: { type: Boolean, default: false },
  oldUser: { type: String, default: 'none' }
});

userConference.index({ userId: 1, conferenceId: 1, oldUser: 1 }, { unique: true });

module.exports = mongoose.model('userConference', userConference, 'userConferences');