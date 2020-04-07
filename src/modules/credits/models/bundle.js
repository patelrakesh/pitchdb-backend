const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let bundle = new Schema({
  amount: { type: Number, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true},
  enabled: {type: Boolean, default: true}
});

module.exports = mongoose.model('bundle', bundle);