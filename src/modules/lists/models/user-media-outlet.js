const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userMediaOutlet = new Schema({
  userId: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
  mediaOutletId: { type: String, required: true },
  mediaOutlet: { type: Object, required: true },
  date: { type: Date, default: Date.now },
  connected: { type: Boolean, default: false },
  oldUser: { type: String, default: 'none' }
});

userMediaOutlet.index({ userId: 1, mediaOutletId: 1, oldUser: 1 }, { unique: true });

module.exports = mongoose.model('userMediaOutlet', userMediaOutlet, 'userMediaOutlets');