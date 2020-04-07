const express = require('express');
const router = express.Router();

const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');
const searchController = require('../../modules/util/controllers/search');

const handleStandard = require("../../modules/common/util/handle-standard");

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifyPrivileges);

router.get('/', (req, res, next) => {
  searchController.getSearches(req, (err, searches) => {
    handleStandard(req,res, err, searches, next);
  })
})

router.get('/count', (req, res, next) => {
  searchController.getSearchCount(req, (err, count) => {
    handleStandard(req,res, err, count, next);
  })
})

module.exports = router;