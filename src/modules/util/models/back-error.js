const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let backError = new Schema({
    date: { type: Date, default: Date.now },
    module: { type: String, required: false },
    message: { type: String, required: true }
});

module.exports = mongoose.model('backErrors', backError);