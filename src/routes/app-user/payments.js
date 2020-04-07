/* eslint-disable linebreak-style */
const express = require('express');
const router = express.Router();

const paymentController = require('../../modules/credits/controllers/payment');
const handleStandard = require("../../modules/common/util/handle-standard");

const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');

const validations = require('./validations/payments');

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.post('/bundle', validations.postBundle, (req, res, next) => {
    paymentController.purchaseBundle(req, (err, orderResult) => {
        handleStandard(req,res, err, orderResult, next);
    })
});

module.exports = router;