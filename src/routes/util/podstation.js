const router = require('express').Router();

const podstationController = require("../../modules/podcasts/controllers/podstation");

const handleStandard = require("../../modules/common/util/handle-standard");

const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');

router.all('/*', routeInterceptor.verifyToken);

// Podcast search

router.post('/podcasts', (req, res, next) => {
  podstationController.persistPodcasts(req, (err, podcast) => {
    handleStandard(req,res, err, podcast, next);
  })
});

router.post('/list-items', (req, res, next) => {
  podstationController.addPodcastToList(req, (err, podcast) => {
    handleStandard(req,res, err, podcast, next);
  })
});

module.exports = router;