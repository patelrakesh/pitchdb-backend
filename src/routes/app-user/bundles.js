/* eslint-disable linebreak-style */
const router = require('express').Router()
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const bundleController = require('../../modules/credits/controllers/bundle');
const handleStandard = require("../../modules/common/util/handle-standard");

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.get('/', (req, res, next) => {
  bundleController.get(req, (err, bundles) => {
    handleStandard(req, res, err, bundles, next);
  })
});

module.exports = router;