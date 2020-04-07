const languages = require('../resources/languages.json');

const podcastParamsController = {
  getLanguages: callback => {
    if (languages) callback(null, languages);
    else callback("No languages found");
  },

  transform: callback => {
    let transformedArray = [];
    languages.forEach(element => {
      transformedArray.push({
        value: element,
        label: element
      });
    });
    callback(null, transformedArray);
  }
};

module.exports = podcastParamsController;