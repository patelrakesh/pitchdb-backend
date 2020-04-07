/* eslint-disable linebreak-style */
const router = require('express').Router()
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const stagesChartController = require("../../modules/charts/controllers/stage");
const handleStandard = require("../../modules/common/util/handle-standard");

const validations = require('./validations/charts');

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.get('/stages/summary', validations.getStagesSummary, (req, res, next) => {
  stagesChartController.getSummary(req, (err, summary) => {
    handleStandard(req, res, err, summary, next);
  })
});

router.get('/stages/amounts', validations.getStagesAmounts, (req, res, next) => {
  stagesChartController.getAmount(req, (err, amounts) => {
    handleStandard(req, res, err, amounts, next);
  })
});

module.exports = router;