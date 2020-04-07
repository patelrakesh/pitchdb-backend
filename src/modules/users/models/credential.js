const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const credential = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'user' },
  password: { type: String, required: true },
});

module.exports = mongoose.model('credential', credential);
