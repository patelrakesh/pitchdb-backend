const types = require('../resources/organizer-types.json');
const schoolTypes = require('../resources/school-types.json');
const sponsorIndustries = require('../resources/sponsor-industries.json');
const sponsorMarkets = require('../resources/sponsor-markets.json');

const organizerParamsController = {
  getTypes: callback => {
    callback(null, types);
  },

  getSchoolTypes: callback => {
    callback(null, schoolTypes);
  },

  getSponsorIndustries: callback => {
    callback(null, sponsorIndustries);
  },

  getSponsorMarkets: callback => {
    callback(null, sponsorMarkets);
  }
};

const sortByLabel = array => {
  array.sort((a, b) => {
    var nameA = a.label.toUpperCase(); // ignore upper and lowercase
    var nameB = b.label.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }

    // names must be equal
    return 0;
  });
}

sortByLabel(schoolTypes);
sortByLabel(sponsorIndustries);
sortByLabel(sponsorMarkets);

module.exports = organizerParamsController;