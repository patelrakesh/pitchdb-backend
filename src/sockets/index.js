const SOCKETIO_DEFAULT_URL = '/socket.io';

module.exports = (server, callback) => {
  let io = require('socket.io')(server,
    {
      path: process.env.NODE_ENV === 'production' ? '/socket-api' + SOCKETIO_DEFAULT_URL : SOCKETIO_DEFAULT_URL
    });

  // Enable socket functionallity for podcasts search
  require('../sockets/app-user/podcasts')(io);

  callback();
}