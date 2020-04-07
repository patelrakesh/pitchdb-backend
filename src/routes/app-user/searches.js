/* eslint-disable linebreak-style */
const express = require('express');
const router = express.Router();
const searchController = require('../../modules/util/controllers/search');
const routeInterceptor = require('../../modules/common/interceptors/route-interceptor');

router.all('/*', routeInterceptor.verifyToken);
router.all('/*', routeInterceptor.verifySessionValidity);

router.post('/', (req, res) => {
  res.send();
  searchController.saveSearch(req.decoded, req.body);

})

module.exports = router;