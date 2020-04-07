const { query, body } = require('express-validator/check');

const types = ['podcast', 'episode', 'eventOrganization', 'business', 'guest', 'mediaOutlet', 'conference'];

const typeCheck = query('type', 'Invalid type value').isIn(types);

const listItemsisArray = body().isArray();

module.exports = {
  getItemsById: [
    typeCheck
  ],
  postItemsById: [
    typeCheck,
    listItemsisArray
  ],
  geItemsByIdCount: [
    typeCheck
  ]
}