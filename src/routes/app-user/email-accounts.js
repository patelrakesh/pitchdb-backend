/* eslint-disable linebreak-style */
const router = require('express').Router();
const emailAccountController = require('../../modules/users/controllers/email-account');
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const handleStandard = require("../../modules/common/util/handle-standard");

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.get("/primary", (req, res, next) => {
  emailAccountController.getActiveEmailAccount(req.decoded.userId, (err, url) => {
    handleStandard(req, res, err, url, next);
  })
});

router.get("/:network", (req, res, next) => {
  emailAccountController.getAuthUrl(req, (err, url) => {
    handleStandard(req, res, err, url, next);
  })
});

router.post("/:network/configure", (req, res, next) => {
  emailAccountController.configureAccount(req, (err, data) => {
    handleStandard(req, res, err, data, next);
  })
});


router.get('/', (req, res, next) => {
  emailAccountController.getEmailAccounts(req.decoded.userId, (err, data) => {
    handleStandard(req, res, err, data, next);
  })
})

router.get('/byNetwork/:network', (req, res, next) => {
  emailAccountController.getEmailAccountsByNetwork(req.decoded.userId, req.params.network, (err, data) => {
    handleStandard(req, res, err, data, next);
  })
})

router.put('/:id/activation', (req, res, next) => {
  emailAccountController.setPrimaryAccount(req.decoded.userId, req.params.id, (err, data) => {
    handleStandard(req, res, err, data, next);
  })
})

router.post('/gmail-activation', (req, res, next) => {
  emailAccountController.setGmailAccountPrimary(req, (err, data) => {
    handleStandard(req, res, err, data, next);
  })
})

module.exports = router;