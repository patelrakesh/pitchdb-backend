const mongoose = require('mongoose');

let genre = new mongoose.Schema({
  name: String,
  listenNotesId: Number,
  parentId: Number
});
module.exports = mongoose.model('genre', genre);