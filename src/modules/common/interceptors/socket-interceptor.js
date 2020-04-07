let jwt = require('jsonwebtoken');
const constants = require('./constants/socket-interceptor')

const JWT_AUTH_EVENT = 'jwt-authentication';

const INVALID_TOKEN = 'Invalid token';
const NO_TOKEN = 'No token';

const socketAuthenticator = {

  authenticateUser: (socket, next) => {

    // Listen for the jwt auth event which should have a bearer token
    socket.on(JWT_AUTH_EVENT, token => {
      if (token) {
        jwt.verify(token.split(" ")[1], process.env.AUTHORITY_SPARK_SECRET, (err, decoded) => {
          if (err) {
            // Unauthorized, close connection
            socket.emit(constants.INVALID_JWT, INVALID_TOKEN);
            socket.disconnect();
            next();
          } else {
            // Pass user data encoded in token to subsequent methods
            next(decoded);
          }
        })
      } else {
        socket.emit(constants.INVALID_JWT, NO_TOKEN);
        socket.disconnect();
        next();
      }
    })
  }
};

module.exports = socketAuthenticator;