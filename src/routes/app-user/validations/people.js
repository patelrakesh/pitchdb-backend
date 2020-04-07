const { query, body } = require('express-validator/check');

const strMinMax = { min: 0, max: 100 };

const optionalFieldsGetSearch = ['exclude', 'country', 'state', 'city', 'industry', 'jobTitle']

const keywordsLength = query('keywords').isLength(strMinMax);
const optionalsLength = query(optionalFieldsGetSearch).optional().isLength(strMinMax);
const prospectsIsArray = body().isArray();

module.exports = {
  getSearch: [
    keywordsLength,
    optionalsLength
  ],
  postLookup: [
    prospectsIsArray
  ]
}