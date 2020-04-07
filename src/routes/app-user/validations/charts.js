const moment = require('moment');
const commonChartConstants = require('../../../modules/charts/constants/common');
const { query } = require('express-validator/check');

const fromDate = query('dateStart', 'Invalid from date').custom((value) => {
  if (value && !moment(value, commonChartConstants.DATE_FORMAT).isValid()) {
    throw new Error('Invalid date range');
  }
  else return true;
});

const toDate = query('dateTo', 'Invalid to date').custom((value) => {
  if (value && !moment(value, commonChartConstants.DATE_FORMAT).isValid()) {
    throw new Error('Invalid date range');
  }
  else return true;
});

const fromDateRequired = query('dateStart', 'Invalid from date').custom((value) => {
  if (!value || !moment(value, commonChartConstants.DATE_FORMAT).isValid()) {
    throw new Error('Invalid date range');
  }
  else return true;
});

const toDateRequired = query('dateTo', 'Invalid to date').custom((value) => {
  if (!value || !moment(value, commonChartConstants.DATE_FORMAT).isValid()) {
    throw new Error('Invalid date range');
  }
  else return true;
});

module.exports = {
  getStagesSummary: [
    fromDate,
    toDate
  ],
  getStagesAmounts: [
    fromDateRequired,
    toDateRequired
  ]
}