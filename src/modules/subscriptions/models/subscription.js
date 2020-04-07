const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let subscription = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  type: { type: String, default: 'free' },

  // Possible status are 'active', 'canceled' or 'unpaid'
  status: { type: String, required: true },
  dateStart: { type: Date, required: true },
  lastRenewWal: { type: Date, required: true },
  dateEnd: { type: Date, required: true },
  stripeSubId: { type: String, required: true },
  credits: { type: Number, required: false },
  planId: { type: String, required: false },
  scheduledToCancel: { type: Boolean, default: false }
});

subscription.index({ stripeSubId: 1 });

module.exports = mongoose.model('subscription', subscription);