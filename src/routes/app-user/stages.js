/* eslint-disable linebreak-style */
const router = require('express').Router();
const stageController = require('../../modules/outreach/controllers/stage');
const stageActionsController = require('../../modules/outreach/controllers/stage-actions');
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const handleStandard = require("../../modules/common/util/handle-standard");

const validations = require('./validations/stages');

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.get("/latestByCategory/:category", validations.getLatestByCategory, (req, res, next) => {
  stageController.getLatestStagesBycategory(req.params.category, req.decoded.userId, (err, docs) => {
    handleStandard(req, res, err, docs, next);
  })
})

/*
* These endpoints are used to trigger stage changes in  outreach sequences
*/

router.post('/action/send', validations.postActionSend, (req, res, next) => {
  stageActionsController.stageSend(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
})

router.post('/action/opened', validations.postActionOpened, (req, res, next) => {
  stageActionsController.stageOpen(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
})


router.post('/action/replied', validations.postActionReplied, (req, res, next) => {
  stageActionsController.stageReply(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
})

router.post('/action/book', validations.postActionBook, (req, res, next) => {
  stageActionsController.stageBook(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
})

router.post('/action/postpone', validations.postActionPostpone, (req, res, next) => {
  stageActionsController.stagePostpone(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
})

router.post('/action/restore', validations.postActionRestore, (req, res, next) => {
  stageActionsController.stageRestore(req, (err, result) => {
    handleStandard(req, res, err, result, next);
  })
})

module.exports = router;