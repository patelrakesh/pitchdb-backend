const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userGuest = new Schema({
  userId: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
  guestId: { type: Schema.Types.ObjectId, ref: 'guest', required: true },
  guest: {
    hasEmail: { type: Boolean, required: false },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    fullName: { type: String, required: false },
    company: { type: String, required: false },
    domain: { type: String, required: false },
    jobTitle: { type: String, required: false },
    image: { type: String, required: false },
    confidence: { type: Number, required: false },
    businessId: { type: String, required: false },
    _id: false
  },
  date: { type: Date, default: Date.now },
  connected: { type: Boolean, default: false },
  oldUser: { type: String, default: 'none' }
});

userGuest.index({ userId: 1, guestId: 1, oldUser: 1 }, { unique: true });

module.exports = mongoose.model('userGuest', userGuest, 'userGuests');