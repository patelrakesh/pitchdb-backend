const axios = require('axios');
const winston = require('winston');
const SNOV_API_BASE_URL = 'https://app.snov.io/';

const STATUS_INITIAL = 0;
const STATUS_SEARCHING = 1;

const TOKEN_PARAMETERS = {
  grant_type: "client_credentials",
  client_id: process.env.SNOV_API_ID,
  client_secret: process.env.SNOV_API_SECRET
}

let token = {}

const snovAPIController = {
  getGuestEmail: (guest, next) => {
    if (!token.value || token.expirationDate < new Date())
      snovAPIController.getNewAccessToken(err => {
        if (err) {
          //winston.warn(err.message)
          next(null, guest, 0)
        } else {
          snovAPIController.getEmail(guest, STATUS_INITIAL, next);
        }
      })
    else {
      snovAPIController.getEmail(guest, STATUS_INITIAL, next);
    }
  },

  getEmail: (guest, step, next) => {
    if (guest.domain && guest.firstName && guest.lastName) {
      let gue = guest;
      let queryParams = "?";
      queryParams += "firstName=" + guest.firstName;
      queryParams += "&lastName=" + guest.lastName;
      queryParams += "&domain=" + guest.domain;
      axios.post(SNOV_API_BASE_URL + "restapi/get-emails-from-names" + queryParams, {}, { headers: { Authorization: 'Bearer ' + token.value } })
        .then(response => {
          let complete = false;
          if (response.data && response.data.status) {
            let identifier = response.data.status.identifier;
            if (identifier === "not_found" && step === STATUS_INITIAL) {
              snovAPIController.attempSearch(gue, next);
            }
            else if (identifier === "in_progress") {
              setTimeout(() => {
                snovAPIController.getEmail(gue, STATUS_SEARCHING, next);
              }, 2000);
            }
            else if (identifier === "complete") {
              snovAPIController.parseEmailResults(response.data.data, gue);
              complete = true;
            }
          }
          else complete = true;
          if (complete) next(null, gue, 0);
        })
        .catch(err => {
          //winston.warn(err.message);
          next(null, gue, 0)
        })
    }
    else
      next(null, guest, 0)
  },

  attempSearch: (guest, next) => {
    let queryParams = "?";
    queryParams += "firstName=" + guest.firstName;
    queryParams += "&lastName=" + guest.lastName;
    queryParams += "&domain=" + guest.domain;
    let gue = guest;
    axios.post(SNOV_API_BASE_URL + "restapi/add-names-to-find-emails" + queryParams, {}, { headers: { Authorization: 'Bearer ' + token.value } })
      .then(response => {
        if (response.data.sent)
          snovAPIController.getEmail(gue, STATUS_SEARCHING, next)
      })
      .catch(err => {
        //winston.warn(err.message)
        next(null, gue, 0)
      })
  },

  parseEmailResults: (data, guest) => {
    data.emails.forEach(email => {
      if (email.emailStatus === "valid" && !guest.email) {
        guest.email = email.email;
        guest.obtentionMethod = 'snovio'
      }
    });
  },

  getNewAccessToken: callback => {
    axios.post(SNOV_API_BASE_URL + "oauth/access_token", TOKEN_PARAMETERS)
      .then(response => {

        let expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + response.data.expires_in)
        token = {
          value: response.data.access_token,
          expirationDate: expirationDate
        }
        callback()
      })
      .catch(err => {
        callback(err)
      })
  }
}

module.exports = snovAPIController;