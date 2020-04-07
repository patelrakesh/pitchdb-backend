const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let team = new Schema({
  dateCreated: { type: Date, required: false, default: Date.now },
});
module.exports = mongoose.model('team', team);