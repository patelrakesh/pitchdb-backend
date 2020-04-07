let mongoose = require('mongoose');

let state = new mongoose.Schema({
  refId: String,
  label: String,
  value: String,
  countryId: String
});

state.index({ refId: 1 }, { unique: true })

module.exports = mongoose.model('state', state);
