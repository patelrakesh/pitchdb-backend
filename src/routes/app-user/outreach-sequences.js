/* eslint-disable linebreak-style */
const router = require('express').Router();
const outreachSequenceController = require('../../modules/outreach/controllers/outreach-sequence');
const stageController = require('../../modules/outreach/controllers/stage');
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const handleStandard = require("../../modules/common/util/handle-standard");

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.get("/", (req, res, next) => {
  outreachSequenceController.getAll(req.decoded.userId, (err, sequences) => {
    handleStandard(req, res, err, sequences, next);
  })
});

router.get('/:id', (req, res, next) => {
  outreachSequenceController.getOutreachDetail(req, (err, sequence) => {
    handleStandard(req, res, err, sequence, next);
  })
})

router.post('/:id/stage', (req, res, next) => {
  stageController.createStage(
    {
      ...req.body,
      userId: req.decoded.userId,
      teamId: req.decoded.teamId
    },
    (err, stage) => {
      handleStandard(req, res, err, stage, next);
    })
})

router.delete('/:id', (req, res, next) => {
  outreachSequenceController.deleteOutreachSequence(req.params.id, req.decoded.userId, (err) => {
    handleStandard(req, res, err, null, next);
  })
})

router.get('/:id/email-validity', (req, res, next) => {
  outreachSequenceController.getEmailReport(req, (err, report) => {
    handleStandard(req, res, err, report, next);
  })
})

router.put('/:id/email-validity', (req, res, next) => {
  outreachSequenceController.createEmailReport(req, (err, report) => {
    handleStandard(req, res, err, report, next);
  })
})

router.put('/:id/add-note', (req, res, next) => {
  outreachSequenceController.addNote(req, (err, report) => {
    handleStandard(req, res, err, report, next);
  })
})

router.put('/:id/edit-note/:idNote', (req, res, next) => {
  outreachSequenceController.editNote(req, (err, report) => {
    handleStandard(req, res, err, report, next);
  })
})

router.delete('/:id/remove-note/:idNote', (req, res, next) => {
  outreachSequenceController.removeNote(req, (err, report) => {
    handleStandard(req, res, err, report, next);
  })
})

module.exports = router;