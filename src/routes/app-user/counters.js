/* eslint-disable linebreak-style */
const router = require('express').Router()
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const counterController = require("../../modules/credits/controllers/counter");
const handleStandard = require("../../modules/common/util/handle-standard");

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.get('/', (req, res, next) => {
    counterController.get(req.decoded.userId, req.decoded.teamId, (err, counter) => {
        handleStandard(req,res, err, counter, next);
    })
})

module.exports = router;