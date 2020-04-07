const socketAuthenticator = require('../../modules/common/interceptors/socket-interceptor');
const podcastSearchController = require('../../modules/podcasts/controllers/podcast-search');
const podcastsEvents = require('../../modules/podcasts/constants/podcast-events');

module.exports = io => {

  // Listen for incoming socket connections on the 'so-podcasts' route
  let podcastsCon = io.of('/so-podcasts');
  podcastsCon.on('connect', socket => {
    socketAuthenticator.authenticateUser(socket, user => {
      // Always disconnect whenever the search was sucessful or not
      if (user)
        podcastSearchController.performSearch(socket.handshake.query, socket, err => {
          if (err) {
            socket.emit(podcastsEvents.SEARCH_ERROR);
          }
          else {
            socket.emit(podcastsEvents.RESULTS_COMPLETE);
          }
          socket.disconnect();
        })
      else {
        socket.emit(podcastsEvents.SEARCH_ERROR);
        socket.disconnect();
      }
    })
  })
};