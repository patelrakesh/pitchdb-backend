/* eslint-disable linebreak-style */
const router = require('express').Router();
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const genresController = require("../../modules/podcasts/controllers/genre");
const podcastParamsController = require("../../modules/parameters/controllers/podcast");
const eventParamsController = require("../../modules/parameters/controllers/event");
const organizerParamsController = require("../../modules/parameters/controllers/organizer");
const globalParamsController = require("../../modules/parameters/controllers/global");
const guestParamsController = require("../../modules/parameters/controllers/people");
const handleStandard = require("../../modules/common/util/handle-standard");


router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.get('/genres', routeInterceptor.useCache(100), (req, res, next) => {
    genresController.getGenres((err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/languages', routeInterceptor.useCache(100), (req, res, next) => {
    podcastParamsController.getLanguages((err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/transform', (req, res, next) => {
    podcastParamsController.transform((err, data) => {
        handleStandard(req,res, err, data, next);
    })
})

router.get('/locations', routeInterceptor.useCache(100), (req, res, next) => {
    eventParamsController.getLocations((err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/places', routeInterceptor.useCache(100), (req, res, next) => {
    eventParamsController.getPlaces((err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/months', routeInterceptor.useCache(100), (req, res, next) => {
    eventParamsController.getMonths((err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/roles', routeInterceptor.useCache(100), (req, res, next) => {
    eventParamsController.getRoles((err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/states', routeInterceptor.useCache(100), (req, res, next) => {
    globalParamsController.getStates(req.query.countryId, (err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/cities', routeInterceptor.useCache(100), (req, res, next) => {
    globalParamsController.getCities(req.query.stateId, (err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/countries', routeInterceptor.useCache(100), (req, res, next) => {
    globalParamsController.getCountries((err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/types', routeInterceptor.useCache(100), (req, res, next) => {
    organizerParamsController.getTypes((err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/school-types', routeInterceptor.useCache(100), (req, res, next) => {
    organizerParamsController.getSchoolTypes((err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/sponsorIndustries', routeInterceptor.useCache(100), (req, res, next) => {
    organizerParamsController.getSponsorIndustries((err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/sponsorMarkets', routeInterceptor.useCache(100), (req, res, next) => {
    organizerParamsController.getSponsorMarkets((err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

router.get('/guestIndustries', routeInterceptor.useCache(100), (req, res, next) => {
    guestParamsController.getIndustries((err, data) => {
        handleStandard(req,res, err, data, next);
    })
});

module.exports = router;