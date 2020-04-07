const { param, body } = require('express-validator/check');
const stagesConstants = require('../../../modules/outreach/constants/stages');

const stagesCategories = [
  stagesConstants.BOOKED,
  stagesConstants.BOUNCED,
  stagesConstants.CONVERSED,
  stagesConstants.OPENED,
  stagesConstants.POSTPONED,
  stagesConstants.REPLIED,
  stagesConstants.SENT,
  stagesConstants.WAITING
]

const stageCategory = param('category').isIn(stagesCategories);
const sequenceMustExist = body('sequence').not().isEmpty();
const bodyIsArray = body().isArray();
const bodyMustExist = body().not().isEmpty();
const stagesIsArray = body('stages').isArray();

module.exports = {
  getLatestByCategory: [
    stageCategory
  ],
  postActionSend: [
    sequenceMustExist
  ],
  postActionOpened: [
    bodyIsArray
  ],
  postActionReplied: [
    bodyIsArray
  ],
  postActionBook: [
    bodyMustExist
  ],
  postActionPostpone: [
    bodyMustExist
  ],
  postActionRestore: [
    stagesIsArray
  ]
}