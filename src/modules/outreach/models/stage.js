const mongoose = require('mongoose');
const schemas = require('../models-common/schemas');

module.exports = mongoose.model('stage', schemas.stageSchema());