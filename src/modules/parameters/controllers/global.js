const City = require('../models/city');
const State = require('../models/state');
const Country = require('../models/country');

const globalParamsController = {
  getCountries: callback => {
    Country.find({}).sort('label').exec((err, docs) => {
      if (err) callback(err);
      else callback(null, docs);
    })
  },

  getStates: (countryId, callback) => {
    State.find({ countryId: countryId }).sort('label').exec((err, docs) => {
      if (err) callback(err);
      else callback(null, docs);
    })
  },

  getCities: (stateId, callback) => {
    City.find({ stateId: stateId }).sort('label').exec((err, docs) => {
      if (err) callback(err);
      else callback(null, docs);
    })
  }

};


module.exports = globalParamsController;