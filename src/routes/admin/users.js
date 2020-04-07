/* eslint-disable linebreak-style */
const express = require('express');
const router = express.Router();

const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const adminUserController = require('../../modules/users/controllers/admin-user');
const adminCreditController = require('../../modules/credits/controllers/admin-credit');

const handleStandard = require("../../modules/common/util/handle-standard");

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);
router.all('/*', routeInterceptor.verifyPrivileges);

router.get('/', (req, res, next) => {
  adminUserController.getAllUsers(req, (err, users) => {
    handleStandard(req,res, err, users, next);
  })
});

router.get('/count', (req, res, next) => {
  adminUserController.countUsers(req, (err, data) => {
    handleStandard(req,res, err, data, next);
  })
});

router.post('/', (req, res, next) => {
  adminUserController.createUser(req.body, (err, user) => {
    handleStandard(req,res, err, user, next)
  })
})

router.delete('/:id', (req, res, next) => {
  adminUserController.deleteUser(req.params.id, (err) => {
    handleStandard(req,res, err, null, next);
  })
})

router.put('/:id/credits', (req, res, next) => {
  adminCreditController.addCredits(req.params.id, req.body, (err, creditsData) => {
    handleStandard(req,res, err, creditsData, next);
  })
})

router.put('/:id/reset', (req, res, next) => {
  adminUserController.resendNewPassword(req.params.id, (err) => {
    handleStandard(req,res, err, null, next);
  })
})

router.get('/:id/user-token', (req, res, next) => {
  adminUserController.getUserLoginToken(req, (err, token) => {
    handleStandard(req,res, err, token, next);
  })
})

//New feature for toggling toggling a user account between active and inactive
router.put('/:id/status-toggle', (req, res, next) => {
  adminUserController.statusToggle(req.params.id, err => {
    handleStandard(req,res, err, null, next);
  })
})

//New feature for adding privilege to a user
router.put('/:id/add-privilege', (req, res, next) => {
  adminUserController.addPrivilege(req.params.id, req.query.privilege, err => {
    handleStandard(req,res, err, null, next);
  })
})

//New feature for removing privilege from a user
router.put('/:id/remove-privilege', (req, res, next) => {
  adminUserController.removePrivilege(req.params.id, req.query.privilege, err => {
    handleStandard(req,res, err, null, next);
  })
})

module.exports = router;