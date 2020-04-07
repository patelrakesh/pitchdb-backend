const router = require('express').Router();
const webhookController = require('../../modules/subscriptions/controllers/webhook')
const handleStandard = require("../../modules/common/util/handle-standard");

// TODO: Apply Domain-specific CORS middleware

router.post('/invoice-upcoming', (req, res, next) => {
  webhookController.handleInvoiceUpcoming(req, (err) => {
    handleStandard(req,res, err, null, next);
  })
});

router.post('/invoice-payment-succeeded', (req, res, next) => {
  webhookController.handleInvoicePaymentSucceeded(req, (err) => {
    handleStandard(req,res, err, null, next);
  })
});

router.post('/customer-subscription-updated', (req, res, next) => {
  webhookController.handleCustomerSubscriptionUpdated(req, (err) => {
    handleStandard(req,res, err, null, next);
  })
});
module.exports = router;