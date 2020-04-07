let mongoose = require('mongoose');

let city = new mongoose.Schema({
  refId: String,
  label: String,
  value: String,
  stateId: String
});

city.index({ refId: 1 }, { unique: true })

module.exports = mongoose.model('city', city);
