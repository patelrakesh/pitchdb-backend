const locations = require('../resources/locations.json');
const places = require('../resources/places.json');
const months = require('../resources/months.json');
const roles = require('../resources/roles-at-organization.json');

const eventParamsController = {
  getLocations: callback => {
    callback(null, locations);
  },

  getPlaces: callback => {
    callback(null, places);
  },

  getMonths: callback => {
    callback(null, months);
  },

  getRoles: callback => {
    callback(null, roles);
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

sortByLabel(locations);
sortByLabel(places);
sortByLabel(roles);

module.exports = eventParamsController;