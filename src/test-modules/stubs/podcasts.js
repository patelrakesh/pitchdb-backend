const podcastSearchController = require('../../modules/podcasts/controllers/podcast-search');
const podcastsMocks = require('../mocks/podcasts');

module.exports = {
    searchListenNotesAPI: (socket, params, queryParams, callback) => {
        podcastSearchController.processSearchResults(socket, params, podcastsMocks.listenNotesResponse, callback);
    }
}