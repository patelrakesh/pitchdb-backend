const mongoose = require('mongoose');

let country = new mongoose.Schema({
  refId: String,
  name: String,
  sortname: String
});

country.index({ refId: 1 }, { unique: true })

module.exports = mongoose.model('country', country);