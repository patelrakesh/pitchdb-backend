const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let counter = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
  remaining: { type: Number, required: true, default: 5 },
  used: { type: Number, required: true, default: 0 }
});

module.exports = mongoose.model('counter', counter);