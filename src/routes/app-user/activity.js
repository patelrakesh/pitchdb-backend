/* eslint-disable linebreak-style */
const router = require('express').Router()
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const activityController = require('../../modules/activity/controllers/activity');
const handleStandard = require("../../modules/common/util/handle-standard");

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.get('/', (req, res, next) => {
  activityController.getLatest(req, (err, activities) => {
    handleStandard(req,res, err, activities, next);
  })
});

module.exports = router;