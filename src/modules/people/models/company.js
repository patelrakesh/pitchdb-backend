var mongoose = require('mongoose');

var company = new mongoose.Schema({
    domain: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    logo: { type: String, required: false },
    description: { type: String, required: false },
    url: { type: String, required: false }
});
module.exports = mongoose.model('company', company, 'companies');
