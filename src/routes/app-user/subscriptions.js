/* eslint-disable linebreak-style */
const router = require('express').Router()
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const subscriptionController = require("../../modules/subscriptions/controllers/subscription");
const handleStandard = require("../../modules/common/util/handle-standard");

const validations = require('./validations/subscriptions');

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.post('/', validations.post, (req, res, next) => {
  subscriptionController.createNewSubscription(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
})

router.get('/current', (req, res, next) => {
  subscriptionController.getUserCurrentSubscription(req, (err, subscription) => {
    handleStandard(req, res, err, subscription, next);
  })
})

router.put('/current', (req, res, next) => {
  subscriptionController.updateSubscription(req, (err, subscription) => {
    handleStandard(req, res, err, subscription, next);
  })
})

router.delete('/current', (req, res, next) => {
  subscriptionController.cancelSubscription(req, (err, subscription) => {
    handleStandard(req, res, err, subscription, next);
  })
})

router.get('/plans', (req, res, next) => {
  subscriptionController.getStripePlans((err, plans) => {
    handleStandard(req, res, err, plans, next);
  })
})

module.exports = router;