const router = require('express').Router();

const podcastController = require("../../modules/podcasts/controllers/podcast");
const podcastSearchController = require("../../modules/podcasts/controllers/podcast-search");

const handleStandard = require("../../modules/common/util/handle-standard");

const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');

const validations = require('./validations/podcasts');

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

// Podcast search

router.get('/search', validations.getSearch, routeInterceptor.useCache(100), (req, res, next) => {
  podcastSearchController.performSearch(req.query, 'podcast', (err, data) => {
    handleStandard(req, res, err, data, next);
  })
});

// Podcast data management

router.get('/:id', (req, res, next) => {
  podcastController.getById(req.params.id, false, false, (err, podcast) => {
    handleStandard(req, res, err, podcast, next);
  })

})

router.get('/:id/episodes', routeInterceptor.useCache(100), (req, res, next) => {
  podcastController.getEpisodes(req, (err, episodes) => {
    handleStandard(req, res, err, episodes, next);
  })
})

router.get('/:id/episodes/count', routeInterceptor.useCache(100), (req, res, next) => {
  podcastController.getEpisodesCount(req, (err, data) => {
    handleStandard(req, res, err, data, next);
  })
})

router.get('/:id/reviews', routeInterceptor.useCache(100), (req, res, next) => {
  podcastController.getReviews(req, (err, reviews) => {
    handleStandard(req, res, err, reviews, next);
  })
})

router.get('/:id/reviews/count', routeInterceptor.useCache(100), (req, res, next) => {
  podcastController.getReviewsCount(req, (err, data) => {
    handleStandard(req, res, err, data, next);
  })
})

module.exports = router;