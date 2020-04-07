/* eslint-disable linebreak-style */
const router = require('express').Router();
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const guestSearchController = require("../../modules/people/controllers/people-search");
const guestLookUpController = require("../../modules/people/controllers/people-lookup");
const handleStandard = require("../../modules/common/util/handle-standard");

const validations = require('./validations/people');

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);
router.all('/*', routeInterceptor.verifyPrivileges);

// Search endpoint

/*
* This endpoint does not parse search results. Instead, it generates HTML code to be inserted into the frontend to them parse the results.
* The people search uses a google x-ray search.
*/
router.get('/search', validations.getSearch, routeInterceptor.useCache(100), (req, res, next) => {
  guestSearchController.generateQuery(req.query, (_, file) => {
    handleStandard(req, res, null, file, next);
  })
});

router.post('/lookup', validations.postLookup, (req, res, next) => {
  guestLookUpController.lookupEmails(req, (err, results) => {
    handleStandard(req, res, err, results, next);
  })
});

module.exports = router;