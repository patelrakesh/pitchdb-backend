const axios = require('axios')
const winston = require('winston');
const Company = require('../../models/company');
const CLEARBIT_API_BASE_URL = 'https://company.clearbit.com/v1/domains/find';

const clearbitAPIController = {
  findDomain: (guest, next) => {
    if (guest.company) {
      let queryParams = "?";
      queryParams += "name=" + guest.company
      let gue = guest;
      axios.get(CLEARBIT_API_BASE_URL + queryParams, { headers: { Authorization: 'Bearer ' + process.env.CLEARBIT_API_KEY } })
        .then(response => {
          let newCompany = new Company({ ...response.data });
          newCompany.save((err) => {
            if (err) { //winston.error("Company save error: " + err.message);
            }
            else { //winston.info("New company");
            }
          })
          gue.domain = response.data.domain;
          next(null, gue);
        })
        .catch(err => {
          //winston.warn(err.message);
          next(null, gue);
        })
    }
    else
      next(null, guest);
  }
}

module.exports = clearbitAPIController;