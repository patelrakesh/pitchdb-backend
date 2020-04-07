/* eslint-disable linebreak-style */
const axios = require('axios');
const EmailAccount = require('../models/email-account');
const CustomError = require('../../common/errors/custom-error');

const querystring = require('querystring');

let CALLBACK_URL = process.env.FRONT_BASE_URL + "/emailcallback";
const PUBLIC_PROPS_SELECT = '-emailToken -emailRefreshToken -tokenExpiration';

const networkConstants = require('../constants/networks');
const urlConstants = require('../constants/urls');

const emailAccountController = {

  getAuthUrl: (req, callback) => {
    let queryParams;

    switch (req.params.network) {
      case networkConstants.GMAIL:
        queryParams = "client_id=" + process.env.GOOGLE_ID;
        queryParams += "&redirect_uri=" + CALLBACK_URL;
        queryParams += "&response_type=token";
        queryParams += "&scope=https://www.googleapis.com/auth/gmail.send";
        // queryParams += "&prompt=none";
        callback(null, urlConstants.GOOGLE_OAUTH + "?" + queryParams);
        break;

      case networkConstants.OUTLOOK:
        queryParams = "client_id=" + process.env.MICROSOFT_ID;
        queryParams += "&redirect_uri=" + CALLBACK_URL;
        queryParams += "&response_type=code";
        queryParams += "&scope=openid email offline_access " + encodeURIComponent("https://graph.microsoft.com/User.Read")
          + " " + encodeURIComponent("https://graph.microsoft.com/Mail.Read")
          + " " + encodeURIComponent("https://graph.microsoft.com/Mail.Send");
        callback(null, urlConstants.MICROSOFT_OAUTH + "?" + queryParams);
        break;
      default:
        callback(new CustomError('Invalid network', 400));
        break;
    }
  },

  configureAccount: (req, callback) => {

    let params;
    let method;
    switch (req.params.network) {
      case networkConstants.GMAIL:
        params = {
          grant_type: 'authorization_code',
          code: req.body.code,
          redirect_uri: CALLBACK_URL,
          client_id: process.env.GOOGLE_ID,
          client_secret: process.env.GOOGLE_SECRET
        }
        method = emailAccountController.configureGmail;
        break;

      case networkConstants.OUTLOOK:
        params = {
          client_id: process.env.MICROSOFT_ID,
          client_secret: process.env.MICROSOFT_PASSWORD,
          code: req.body.code,
          redirect_uri: CALLBACK_URL,
          grant_type: 'authorization_code'
        }
        method = emailAccountController.configureOutlook;
        break;
      default:
        callback(new CustomError('Invalid network', 400));
        break;
    }

    method(req, params, callback)
  },

  configureGmail: (req, params, callback) => {
    axios.post(urlConstants.GOOGLE_TOKEN, querystring.stringify(params))
      .then(response => {
        let now = new Date();
        now.setSeconds(now.getSeconds() + response.data.expires_in);
        const authObject = {
          token: response.data.access_token,
          refreshToken: response.data.refresh_token,
          tokenExpiration: now
        }
        let authString = 'Bearer ' + response.data.access_token;
        axios.get(urlConstants.GOOGLE_MAIL_USER, { headers: { Authorization: authString } })
          .then(response => {
            let emailAccountObj = {
              email: response.data.emailAddress,
              network: networkConstants.GMAIL,
              userId: req.decoded.userId,
              emailToken: authObject.token,
              emailRefreshToken: authObject.refreshToken,
              tokenExpiration: authObject.tokenExpiration
            };
            findOrPersistAccount(emailAccountObj, callback);
          })
          .catch(error => {
            callback(error);
          })
      })
      .catch(error => {
        callback(error);
      });
  },

  configureOutlook: (req, params, callback) => {
    axios.post(urlConstants.MICROSOFT_TOKEN, querystring.stringify(params))
      .then(response => {
        let now = new Date();
        now.setSeconds(now.getSeconds() + response.data.expires_in);
        const authObject = {
          token: response.data.access_token,
          refreshToken: response.data.refresh_token,
          tokenExpiration: now
        }
        let authString = 'Bearer ' + response.data.access_token;
        axios.get(urlConstants.MICROSOFT_USER, { headers: { Authorization: authString } })
          .then(response => {
            let emailAccountObj = {
              email: response.data.userPrincipalName,
              network: networkConstants.OUTLOOK,
              userId: req.decoded.userId,
              emailToken: authObject.token,
              emailRefreshToken: authObject.refreshToken,
              tokenExpiration: authObject.tokenExpiration
            };
            findOrPersistAccount(emailAccountObj, callback);
          })
          .catch(error => {
            //console.log(error)
            callback(error)
          })
      })
      .catch(error => {
        //console.log(error)
        callback(error)
      })
  },

  getEmailAccounts: (userId, callback) =>
    EmailAccount.find({ userId: userId }).lean().sort('-activationDate').select(PUBLIC_PROPS_SELECT).exec(callback)
  ,

  getEmailAccountsByNetwork: (userId, network, callback) =>
    EmailAccount.find({ userId: userId, network: network }).select(PUBLIC_PROPS_SELECT).lean().exec(callback)
  ,

  getEmailAccountById: (id, callback) =>
    EmailAccount.findById(id, callback)
  ,

  getActiveEmailAccount: (userId, callback) =>
    EmailAccount.findOne({ userId: userId }).sort('-activationDate').lean().exec(callback)
  ,

  setPrimaryAccount: (userId, emailAccountId, callback) =>
    EmailAccount.findOneAndUpdate({ userId: userId, _id: emailAccountId }, { activationDate: new Date() }, { new: true }).exec(callback),

  setGmailAccountPrimary: (req, callback) => {
    EmailAccount.findOne({ userId: req.decoded.userId, network: 'gmail' }).exec()
      .then(emailAccount => {
        if (!emailAccount) {
          const newEmailAccount = new EmailAccount({
            userId: req.decoded.userId,
            network: 'gmail',
            activationDate: new Date()
          })
          newEmailAccount.save(callback)
        }
        else {
          emailAccount.updateOne({ activationDate: new Date(), email: null }, callback)
        }
      })
      .catch(err => {
        console.log(err)
        callback(new Error('Could not ser primary acount'))
      })
  }
};

const findOrPersistAccount = (emailAccountObj, callback) => {

  EmailAccount.findOne({ userId: emailAccountObj.userId, email: emailAccountObj.email }, (err, doc) => {
    if (err || !doc) {
      let newEmailAccount = new EmailAccount(emailAccountObj);
      newEmailAccount.save((err, doc) => {
        if (err) {
          if (err.code === 11000)
            callback(new CustomError("There is already an account with that email connected, you must use another one", 500));
          else
            callback(err);
        }
        else
          callback(null, doc);
      })
    }
    else {
      emailAccountObj.date = new Date();
      emailAccountObj.invalid = false;
      EmailAccount.findByIdAndUpdate(doc._id, emailAccountObj, { new: true }, callback);
    }

  })
}

module.exports = emailAccountController;