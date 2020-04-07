/* eslint-disable linebreak-style */
const axios = require('axios');
const querystring = require('querystring');
const jwt = require('jsonwebtoken');
const winston = require('winston')

const User = require('../models/user');
const EmailAccount = require('../models/email-account');

const networkConstants = require('../constants/networks');
const urlConstants = require('../constants/urls');

const listController = require('../../lists/controllers/list');
const teamInvitationController = require('../controllers/team-invitation');
const counterController = require('../../credits/controllers/counter');
const errorConstants = require('../../common/errors/constants');
const CustomError = require('../../common/errors/custom-error');

const CALLBACK_URL = process.env.FRONT_BASE_URL + "/authcallback";
const INVALID_INV_MSG = "Invitation invalid or expired, please ask your contact to send you an invitation link again";

const authController = {

  getAuthUrl: (req, callback) => {
    let queryParams = "";
    switch (req.params.network) {
      case networkConstants.LINKEDIN:
        queryParams = "client_id=" + process.env.LINKEDIN_ID;
        queryParams += "&redirect_uri=" + CALLBACK_URL;
        queryParams += "&response_type=code";
        queryParams += '&scope=r_liteprofile%20r_emailaddress'

        callback(null, urlConstants.LINKEDIN_OAUTH + "?" + queryParams);
        break;

      case networkConstants.FACEBOOK:
        queryParams = "client_id=" + process.env.FACEBOOK_ID;
        queryParams += "&redirect_uri=" + CALLBACK_URL;
        queryParams += "&scope=email";
        callback(null, urlConstants.FACEBOOK_OAUTH + "?" + queryParams);
        break;

      case networkConstants.GOOGLE:
        queryParams = "client_id=" + process.env.GOOGLE_ID;
        queryParams += "&redirect_uri=" + CALLBACK_URL;
        queryParams += "&response_type=code";
        queryParams += "&scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
        callback(null, urlConstants.GOOGLE_OAUTH + "?" + queryParams);
        break;

      case networkConstants.MICROSOFT:
        queryParams = "client_id=" + process.env.MICROSOFT_ID;
        queryParams += "&redirect_uri=" + CALLBACK_URL;
        queryParams += "&response_type=code";
        queryParams += "&scope=openid email " + encodeURIComponent("https://graph.microsoft.com/User.Read");
        callback(null, urlConstants.MICROSOFT_OAUTH + "?" + queryParams);
        break;

      default:
        callback(new CustomError('Invalid network', 400));
        break;
    }
  },

  beginLogin: (req, callback) => {

    let params;
    let method;

    switch (req.params.network) {
      case networkConstants.LINKEDIN:
        params = {
          grant_type: 'authorization_code',
          code: req.body.code,
          redirect_uri: CALLBACK_URL,
          client_id: process.env.LINKEDIN_ID,
          client_secret: process.env.LINKEDIN_SECRET
        };
        method = authController.linkedinLogin;
        break;

      case networkConstants.FACEBOOK:
        params = "code=" + req.body.code;
        params += "&redirect_uri=" + CALLBACK_URL;
        params += "&client_id=" + process.env.FACEBOOK_ID;
        params += "&client_secret=" + process.env.FACEBOOK_SECRET;
        method = authController.facebookLogin;
        break;

      case networkConstants.GOOGLE:
        params = {
          grant_type: 'authorization_code',
          code: req.body.code,
          redirect_uri: CALLBACK_URL,
          client_id: process.env.GOOGLE_ID,
          client_secret: process.env.GOOGLE_SECRET
        };
        method = authController.googleLogin;
        break;

      case networkConstants.MICROSOFT:
        params = {
          client_id: process.env.MICROSOFT_ID,
          client_secret: process.env.MICROSOFT_PASSWORD,
          code: req.body.code,
          redirect_uri: CALLBACK_URL,
          grant_type: 'authorization_code'
        };
        method = authController.microsoftLogin;
        break;

      default:
        callback(new CustomError('Invalid network', errorConstants.STATUS_BAD_REQUEST));
        break;
    }

    if (req.body.invitationToken) {
      teamInvitationController.verifyToken(req.body.invitationToken, (err, teamId) => {
        if (err) callback(new CustomError(INVALID_INV_MSG, errorConstants.STATUS_UNAUTHORIZED));
        else
          method(params, false, teamId, null, callback)
      });
    }
    else
      method(params, req.body.isSignIn, null, null, (err, token) => {
        if (err) callback(new CustomError(err.message, errorConstants.STATUS_UNAUTHORIZED));
        else
          callback(null, token);
      })
  },

  linkedinLogin: (params, isSignIn, teamId, userId, callback) => {
    let authString
    let userData = {
      network: networkConstants.LINKEDIN
    }
    axios.post(urlConstants.LINKEDIN_TOKEN, querystring.stringify(params))
      .then(response => {
        authString = 'Bearer ' + response.data.access_token;
        return axios.get(urlConstants.LINKEDIN_USER, { headers: { Authorization: authString } })
      })
      .then(response => {
        userData.name = response.data.localizedFirstName + " " + response.data.localizedLastName
        return axios.get(urlConstants.LINKEDIN_USER_EMAIL, { headers: { Authorization: authString } })
      })
      .then(response => {
        userData.email = response.data.elements[0]['handle~'].emailAddress
        manageUserData(userData, isSignIn, teamId, null, userId, (err, dbUserdata) => {
          authController.saveLoginData(dbUserdata && dbUserdata._id, err);
          if (err) callback(err, null, true);
          else {
            let jwtObject = authController.generateJWT(dbUserdata);

            if (dbUserdata.addedPrivileges && dbUserdata.addedPrivileges.length > 0) {
              //Do something
              console.log("New privileges");

            }

            User.findOneAndUpdate({ _id: dbUserdata._id }, { jwtToken: jwtObject, addedPrivileges: [] }, err => {
              if (err) callback(err);
            })
            callback(null, { token: jwtObject });
          }
        });
      })
      .catch(error => {
        callback(error);
      })
  },

  facebookLogin: (queryParams, isSignIn, teamId, userId, callback) => {
    axios.get(urlConstants.FACEBOOK_TOKEN + '?' + queryParams)
      .then(response => {

        let authString = 'Bearer ' + response.data.access_token;
        let queryFieldsParam = 'fields=id,email,name,locale,picture';
        return axios.get(urlConstants.FACEBOOK_USER + '?' + queryFieldsParam, { headers: { Authorization: authString } })
      })
      .then(response => {
        let userData = {
          name: response.data.name,
          email: response.data.email,
          network: networkConstants.FACEBOOK
        }

        manageUserData(userData, isSignIn, teamId, null, userId, (err, dbUserdata) => {
          authController.saveLoginData(dbUserdata && dbUserdata._id, err);
          if (err) callback(err, null, true);
          else {
            let jwtObject = authController.generateJWT(dbUserdata);

            if (dbUserdata.addedPrivileges && dbUserdata.addedPrivileges.length > 0) {
              //Do something
              console.log("New privileges");

            }

            User.findOneAndUpdate({ _id: dbUserdata._id }, { jwtToken: jwtObject, addedPrivileges: [] }, err => {
              if (err) callback(err);
            })
            callback(null, { token: jwtObject });
          }
        });
      })
      .catch(error => {
        callback(error);
      });
  },

  googleLogin: (params, isSignIn, teamId, userId, callback) => {
    axios.post(urlConstants.GOOGLE_TOKEN, querystring.stringify(params))
      .then(response => {
        let authString = 'Bearer ' + response.data.access_token;
        let queryFieldsParam = 'personFields=names,metadata,emailAddresses';
        return axios.get(urlConstants.GOOGLE_USER + '?' + queryFieldsParam, { headers: { Authorization: authString } })
      })
      .then(response => {
        let userData = {
          name: response.data.names[0].displayName,
          network: networkConstants.GOOGLE
        };
        let email = response.data.emailAddresses[0].value;
        const emailList = response.data.emailAddresses;
        for (let index = 0; index < emailList.length; index++) {
          if (emailList[index].metadata.primary)
            email = emailList[index].value
        }
        userData.email = email;
        manageUserData(userData, isSignIn, teamId, null, userId, (err, dbUserdata) => {
          authController.saveLoginData(dbUserdata && dbUserdata._id, err);
          if (err) {
            callback(err);
          }
          else {
            let jwtObject = authController.generateJWT(dbUserdata);

            if (dbUserdata.addedPrivileges && dbUserdata.addedPrivileges.length > 0) {
              //Do something
              console.log("New privileges");

            }

            User.findOneAndUpdate({ _id: dbUserdata._id }, { jwtToken: jwtObject, addedPrivileges: [] }, err => {
              if (err) callback(err);
            })
            callback(null, { token: jwtObject });
          }
        });
      })
      .catch(error => {
        callback(error);
      });
  },

  microsoftLogin: (params, isSignIn, teamId, userId, callback) => {
    axios.post(urlConstants.MICROSOFT_TOKEN, querystring.stringify(params))
      .then(response => {
        let authString = 'Bearer ' + response.data.access_token;
        return axios.get(urlConstants.MICROSOFT_USER, { headers: { Authorization: authString } })
      })
      .then(response => {
        /* Sample response
        { '@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#users/$entity',
          displayName: 'Santiago Beltran Caicedo',
          surname: 'Beltran Caicedo',
          givenName: 'Santiago',
          id: '1234',
          userPrincipalName: 'email@outlook.com',
          businessPhones: [],
          jobTitle: null,
          mail: null,
          mobilePhone: null,
          officeLocation: null,
          preferredLanguage: null }
        */
        let userData = {
          name: response.data.displayName,
          email: response.data.userPrincipalName,
          network: networkConstants.MICROSOFT
        };
        manageUserData(userData, isSignIn, teamId, null, userId, (err, dbUserdata) => {
          authController.saveLoginData(dbUserdata && dbUserdata._id, err);
          if (err) callback(err);
          else {
            let jwtObject = authController.generateJWT(dbUserdata);
            console.log(dbUserdata._id);


            if (dbUserdata.addedPrivileges && dbUserdata.addedPrivileges.length > 0) {
              //Do something
              console.log("New privileges");

            }

            User.findOneAndUpdate({ _id: dbUserdata._id }, { jwtToken: jwtObject, addedPrivileges: [] }, err => {
              if (err) callback(err);
            })
            callback(null, { token: jwtObject });
          }
        });
      })
      .catch(error => {
        //console.log(error)
        callback(error)
      })
  },

  generateJWT: dbUserdata => {
    return jwt.sign(
      {
        userId: dbUserdata._id,
        teamId: dbUserdata.teamId,
        name: dbUserdata.name,
        role: dbUserdata.role,
        email: dbUserdata.email,
        stripeCustomerId: dbUserdata.stripeCustomerId,
        privileges: dbUserdata.privileges.join()
      },
      process.env.AUTHORITY_SPARK_SECRET)
  },

  saveLoginData: (userId, error) => {
    if (userId) {
      let updateObj = {};
      if (!error) updateObj.dateLastLogin = new Date();
      User.findByIdAndUpdate(userId, updateObj, (err) => {
        if (err) {
          winston.error(err);
        }
      })
    }
  }
};

const manageUserData = (userData, isSignIn, teamId, newEmailAccountObj, userId, callback) => {
  let signAttemp = (isSignIn == 'true');
  if (teamId && !signAttemp) {
    userData.teamId = teamId;
    userData.role = 'member';
  }
  userData.privileges = [];

  User.findOne({ email: userData.email, network: userData.network }, (err, doc) => {

    if (err) callback(err);
    else {
      if (doc && signAttemp && !userId) {
        if (doc.disabled) {
          callback(new CustomError("User is disabled"), 418);
        }
        else {
          callback(null, doc);
        }

      }
      else if (!doc && userId) {
        let updatedUserData = {
          network: userData.network,
          name: userData.name,
          email: userData.email
        }
        User.findByIdAndUpdate(userId, updatedUserData, { new: true }, (err, user) => {
          if (err) {
            if (err.code === 11000) callback(new CustomError(errorConstants.AUTH_EMAIL_EXISTS, errorConstants.STATUS_INTERNAL_SERVER_ERROR))
            else
              callback(err);
          }
          else {
            callback(null, user);
          }
        })
      }
      else if (!doc && !signAttemp && !userId) {
        userData.signupEmail = userData.email;
        userData.signupNetwork = userData.network;
        let newUser = new User(userData);
        newUser.save((err, user) => {
          if (err) {
            if (err.code === 11000) callback(new CustomError(errorConstants.AUTH_EMAIL_EXISTS, errorConstants.STATUS_INTERNAL_SERVER_ERROR))
            else
              callback(err);
          }
          else {
            listController.createDefaultList(user, (err) => {
              if (err) callback(err)
              else {
                if (!teamId) {
                  counterController.createCounter(user._id, teamId, (err) => {
                    if (err) callback(err);
                    else {
                      setDefaultEmailSendingAccount(newEmailAccountObj, user, callback);
                    }
                  })
                }
                else {
                  setDefaultEmailSendingAccount(newEmailAccountObj, user, callback);
                }
              }
            });
          }
        })
      }
      else if (!doc && signAttemp) {
        callback(new CustomError(errorConstants.AUTH_USER_NOT_FOUND, errorConstants.STATUS_NOT_FOUND));
      }
      else {
        callback(new CustomError(errorConstants.AUTH_EMAIL_EXISTS, errorConstants.STATUS_BAD_REQUEST));
      }
    }
  })
}

const setDefaultEmailSendingAccount = (newEmailAccountObj, user, callback) => {
  if (newEmailAccountObj) {
    newEmailAccountObj.userId = user._id;
    let newEmailAccount = new EmailAccount(newEmailAccountObj);
    newEmailAccount.save((err) => {
      if (err)
        callback(err);
      else
        callback(null, user);
    })
  }
  else callback(null, user);
}

module.exports = authController;