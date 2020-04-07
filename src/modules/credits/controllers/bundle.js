const Bundle = require('../models/bundle');

const bundleController = {
  get: (req, callback) => {
    const selectAtts = 'amount type price';
    Bundle.find({ enabled: true }).sort('-cost').select(selectAtts).exec(callback);
  }
}

module.exports = bundleController;