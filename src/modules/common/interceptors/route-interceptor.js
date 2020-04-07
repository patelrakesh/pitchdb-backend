/* eslint-disable linebreak-style */
let jwt = require('jsonwebtoken');
const mcache = require('memory-cache');

const User = require('../../users/models/user');

module.exports = {
  verifyToken: (req, res, next) => {
    let token = req.headers['authorization'];
    if (token) {
      jwt.verify(token.split(" ")[1], process.env.AUTHORITY_SPARK_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({
            success: false,
            message: 'Invalid token.'
          })
        } else {
          req.decoded = decoded
          next();
        }
      })
    } else {
      return res.status(400).send({
        success: false,
        message: 'No token provided.'
      })
    }
  },

  verifyPrivileges: (req, res, next) => {
    const path = req.baseUrl;
    const userPrivileges = req.decoded ? req.decoded.privileges.split(',') : [];
    
    if (path.startsWith('/admin-users'))
      if (userPrivileges.includes('superAdmin'))
        next()
      else{
        return res.status(403).send({ 
            success: false, 
            message: 'insufficent privileges' 
          });
      }
    else if (path.startsWith('/guests')){      
      if (userPrivileges.includes('betaUser') || userPrivileges.includes('superAdmin'))        
         next()
      else{
        return res.status(403).send({ 
          success: false, 
          message: 'insufficent privileges' 
        });
      }       
    }
    else
      next();
  },

  useCache: duration => {
    return (req, res, next) => {
      let key = '__express__' + req.originalUrl || req.url;
      let cachedBody = mcache.get(key);
      if (cachedBody) {
        res.type("json");
        res.send(cachedBody);
        return
      } else {
        res.sendResponse = res.send;
        res.send = (body) => {
          mcache.put(key, body, duration * 1000);
          res.sendResponse(body);
        }
        next();
      }
    }
  },

  verifySessionValidity: (req, res, next) => {
    let token = req.headers['authorization'].split(" ")[1];
    const userId = req.decoded ? req.decoded.userId : "";
    
    User.findById(userId, (err, user) => {
      if (err){
        return res.status(500).send({ 
          success: false, 
          message: err
        });
      }
      else if (!user){
        return res.status(404).send({ 
          success: false, 
          message: 'User not found' 
        });
      } 
      else if(user.jwtToken !== token){
        return res.status(401).send({ 
          success: false, 
          message: 'Session expired' 
        });
      }
      else{
        next();
      }
    })
  }
};