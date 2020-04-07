/* eslint-disable linebreak-style */
const router = require('express').Router();

const userDataController = require('../../modules/users/controllers/user-data');
const userController = require('../../modules/users/controllers/user');
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const handleStandard = require("../../modules/common/util/handle-standard");

const validations = require('./validations/users');

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.get('/me', (req, res, next) => {
  userDataController.getData(req, res, next);
});

router.get('/onboarding', (req, res, next) => {
  userController.update({ onboard: true }, err => {
    handleStandard(req, res, err, null, next);
  })
})

router.put('/social-login/:network', validations.putSocialLoginByNetwork, (req, res, next) => {
  userController.updateSignInMethod(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
})

router.put('/me/password', validations.putMePassword, (req, res, next) => {
  userController.changePassword(req, (err) => {
    handleStandard(req, res, err, null, next);
  })
})

router.get('/me/payment-methods', (req, res, next) => {
  userController.changePassword(req, (err) => {
    handleStandard(req, res, err, null, next);
  })
})

module.exports = router;