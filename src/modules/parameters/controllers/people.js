const industries = require('../resources/guest-industries.json');

const guestParamsController = {
  getIndustries: callback => {
    callback(null, industries);
  },

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

sortByLabel(industries);

module.exports = guestParamsController;