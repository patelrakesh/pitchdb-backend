const { query } = require('express-validator/check');

const searchTypes = ['episode', 'podcast'];
const strMinMax = { min: 0, max: 100 };

const keywordsLength = query('keywords').isLength(strMinMax);
const podcastType = query('type').isIn(searchTypes);

module.exports = {
  getSearch: [
    keywordsLength,
    podcastType
  ]
}