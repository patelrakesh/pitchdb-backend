const axios = require('axios');
const EmailAccount = require('../../users/models/email-account');
const CustomError = require('../../common/errors/custom-error');
const querystring = require('querystring');
const winston = require('winston');

const mailConstants = require('../constants/mail');
const gmailController = require('./gmail');
const outlookController = require('./outlook');

const mailController = {
  checkTokenValidity: (emailAccount, callback) => {
    let now = new Date();
    let dif = emailAccount.tokenExpiration.getTime() - now.getTime();
    let seconds = dif / 1000;

    // Only request a new token if the expiry time is 30 seconds away, this extra time is to account for any delays between this operation 
    // and sending the email using the API
    if (seconds < 30) {
      let params = {
        grant_type: 'refresh_token',
        refresh_token: emailAccount.emailRefreshToken,
      }

      let oauthEndpoint;

      switch (emailAccount.network) {
        case mailConstants.GMAIL:
          params.client_id = process.env.GOOGLE_ID;
          params.client_secret = process.env.GOOGLE_SECRET;
          oauthEndpoint = mailConstants.GOOGLE_TOKEN_URL;
          break;
        case mailConstants.OUTLOOK:
          params.client_id = process.env.MICROSOFT_ID;
          params.client_secret = process.env.MICROSOFT_PASSWORD
          oauthEndpoint = mailConstants.MICROSOFT_TOKEN_URL;
          break;
        default:
          callback(new CustomError('Invalid network', 400));
          break;
      }
      if (oauthEndpoint) {
        axios.post(oauthEndpoint, querystring.stringify(params))
          .then(response => {

            let expDate = new Date();
            expDate.setSeconds(expDate.getSeconds() + response.data.expires_in);
            const authObject = {
              emailToken: response.data.access_token,
              tokenExpiration: expDate
            }
            EmailAccount.findByIdAndUpdate(emailAccount._id, { ...authObject }, { new: true }, (err, foundEmailAccount) => {
              if (err) callback(err);
              callback(null, foundEmailAccount);
            })
          })
          .catch(error => {
            winston.warn(error.response.data);
            callback(error.response.data);
          })
      }
    }
    else
      callback(null, emailAccount);
  },

  sendEmail: (emailData, emailAccount, callback) => {

    let emailObj;
    let requestUrl;
    switch (emailAccount.network) {
      case mailConstants.GMAIL:
        emailObj = { raw: gmailController.buildRfc2822Base64(emailData) };
        requestUrl = mailConstants.GOOGLE_BASE_URL + "users/me/messages/send";
        break;
      case mailConstants.OUTLOOK:
        emailObj = outlookController.buildMailBody(emailData);
        requestUrl = mailConstants.MICROSOFT_BASE_URL + "sendMail";
        break;
      default:
        callback(new CustomError('Invalid network', 400));
        return;
    }

    const authString = 'Bearer ' + emailAccount.emailToken;
    axios.post(requestUrl, emailObj, { headers: { Authorization: authString } })
      .then(response => {

        // It is necessary to call the microsoft API after sending the message so the email token must be checked again 
        // in case enough time has passed and the token is no longer valid between sending of the email and retrieving the sent
        // email's data
        switch (emailAccount.network) {
          case mailConstants.OUTLOOK:
            mailController.checkTokenValidity(emailAccount, (err, updatedEmailAccount) => {
              if (err) callback(err);
              else {
                outlookController.getSentMail(emailData, updatedEmailAccount, callback);
              }
            });
            break;
          default:
            // Gmail case
            callback(null, { emailData: response.data });
            break;
        }
      })
      .catch(error => {
        if (error.response) {
          winston.warn(error.response.data);
          callback(error.response.data);
        }
        else {
          winston.warn(error);
          callback(error);
        }
      })
  },

  getEmailConversation: (content, { network, emailToken }, callback) => {
    switch (network) {
      case mailConstants.GMAIL:
        gmailController.getConversation(content, emailToken, callback);
        break;
      case mailConstants.OUTLOOK:
        outlookController.getConversation(content, emailToken, callback);
        break;
      default:
        callback(new CustomError('Invalid network', 500));
        break;
    }
  }
};

module.exports = mailController;