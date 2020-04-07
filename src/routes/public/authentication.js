const express = require('express');
const router = express.Router();

const authController = require('../../modules/users/controllers/authentication');
const userController = require('../../modules/users/controllers/user');
const handleStandard = require('../../modules/common/util/handle-standard');

const validations = require('./validations/authentication');

router.get('/:network', (req, res, next) => {
  authController.getAuthUrl(req, (err, url) => {
    handleStandard(req, res, err, url, next);
  })
});

router.post('/:network/login', validations.postLoginByNetwork, (req, res, next) => {
  authController.beginLogin(req, (err, token) => {
    handleStandard(req, res, err, token, next);
  })
});


router.post('/login', validations.postLogin, (req, res, next) => {
  userController.login(req.body, (err, token) => {
    handleStandard(req, res, err, token, next);
  })
})

router.put('/password', (req, res, next) => {
  userController.resetPassword(req, (err, token) => {
    handleStandard(req, res, err, token, next);
  })
})

module.exports = router;