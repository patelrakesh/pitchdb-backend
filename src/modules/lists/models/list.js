const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let list = new mongoose.Schema({

  userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
  name: { type: String, required: true },
  dateCreated: { type: Date, required: false, default: Date.now },
  oldUser: { type: String, default: 'none' }
});

list.index({ userId: 1, name: 1, oldUser: 1 }, { unique: true });

module.exports = mongoose.model('list', list, 'lists');