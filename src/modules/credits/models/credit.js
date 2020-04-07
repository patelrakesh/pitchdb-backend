const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let credit = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
  outreachSequenceId: { type: Schema.Types.ObjectId, ref: 'outreachSequence', required: false },
  dateObtained: { type: Date, required: true, default: Date.now },
  // If both "dateConsumed" and "dateLastRefund" are null then it means the credit has not been used yet
  dateConsumed: { type: Date, required: false },
  // bundleType can be "subscription" in order to track the credits obtained through subscribing
  bundleType: { type: String, required: false, default: 'freeStart' },
  paymentId: { type: Schema.Types.ObjectId, ref: 'payment', required: false },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'subscription', required: false },
  dateLastRefund: { type: Date, required: false },
  subscription: { type: Boolean, default: false }
});

module.exports = mongoose.model('credit', credit);