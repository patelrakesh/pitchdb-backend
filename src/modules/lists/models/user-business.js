const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userBusiness = new Schema({
  userId: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
  businessId: { type: String, required: true },
  business: { type: Object, required: true },
  date: { type: Date, default: Date.now },
  connected: { type: Boolean, default: false },
  oldUser: { type: String, default: 'none' }
});

userBusiness.index({ userId: 1, businessId: 1, oldUser: 1 }, { unique: true });

module.exports = mongoose.model('userBusiness', userBusiness, 'userBusinessses');