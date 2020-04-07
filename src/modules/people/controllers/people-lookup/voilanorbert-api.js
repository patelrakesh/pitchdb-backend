const VOILANORBERT_API_BASE_URL = 'https://api.voilanorbert.com/2016-01-04';
const Guest = require('../../models/guest');
const Company = require('../../models/company');
const querystring = require('querystring');

const winston = require('winston');
const axios = require('axios');

/**
 * SEARCH ONLY USING VoilaNorbert API
 * 1. fullName and domain
 * 2. fullName and company name 
 */
const voilanorbertAPIController = {

  findByPerson: (guest, attempt, checkerAttempted, next) => {
    //winston.info("Step 5");
    if (!guest.email) {
      let requestObj = {
        name: guest.name
      }
      if (guest.domain)
        requestObj.domain = guest.domain;
      else
        requestObj.company = guest.company;
      let gue = guest;
      axios.post(VOILANORBERT_API_BASE_URL + '/search/name', querystring.stringify(requestObj), { headers: { Authorization: 'Basic ' + process.env.CLEARBIT_API_KEY } })
        .then(response => {
          let result = response.data;
          let didSearch = false;
          let tries = 0;
          let performLookup = setInterval(() => {
            axios.get(VOILANORBERT_API_BASE_URL + '/contacts/' + result.id, { headers: { Authorization: 'Basic ' + process.env.VOILANORBERT_API_KEY_BASE64 } })
              .then(response => {
                tries++;
                let searchResult = response.data;
                if (!searchResult.searching && !didSearch) {
                  didSearch = true;
                  clearInterval(performLookup);

                  if (searchResult.company.raw_url)
                    voilanorbertAPIController.saveCompany(searchResult.company);

                  if (searchResult.email) {
                    let newGuestObj = {
                      email: searchResult.email.email,
                      domain: searchResult.email.email.substring(searchResult.email.email.indexOf("@") + 1),
                      firstName: gue.firstName,
                      lastName: gue.lastName,
                      fullName: gue.name,
                      company: searchResult.company.name,
                      jobTitle: gue.jobTitle,
                      location: gue.location,
                      confidence: searchResult.email.score,
                      image: gue.image,
                      obtentionMethod: "norbert"
                    }

                    // Clean guest
                    let objProperties = Object.keys(newGuestObj);
                    objProperties.forEach(element => {
                      if (element && ((typeof newGuestObj[element] === 'string' && newGuestObj[element].includes("null")) || !newGuestObj[element]))
                        delete newGuestObj[element];
                    });

                    Object.assign(gue, newGuestObj);

                    let newGuest = new Guest(newGuestObj);
                    newGuest.save((err, doc) => {
                      if (err) {
                        //winston.error("Step 5 - Error saving guest: " + err);
                        next(null, gue);
                      }
                      else {
                        //winston.info("Step 5 - New guest added, via norbert");
                        next(null, doc);
                      }
                    })
                  }
                  else {
                    //winston.error("Step 5 - No email found with norbert");
                    next(null, gue);
                  }
                }
                else if (tries >= 25) {
                  didSearch = true;
                  clearInterval(performLookup);
                  //winston.error("Step 5 - Time ran out for lookup");
                  next(null, gue);
                }
              })
              .catch(error => {
                clearInterval(performLookup);
                if (error.response) {
                  if (error.response.status === 400) {
                    //winston.error("Step 5 - Error cycle email not found: " + error);
                    didSearch = true;
                  }
                  // else
                  //     winston.error("Step 5 - Error cycle email not found: " + error);
                }
                else {
                  winston.error("Step 5 - Error cycle email request: " + error);
                  didSearch = true;
                }
                next(null, gue);
              })
          }, 2000);
        })
        .catch(error => {
          // if (error.response) {
          //     if (error.response.status === 400) {
          //         winston.error("Step 5 - Error email not found: " + error);
          //     }
          //     else
          //         winston.error("Step 5 - Error email not found: " + error);
          // }
          // else {
          //     winston.error("Step 5 - Error email request: " + error);
          // }
          next(null, gue);
        });
    }
    else
      next(null, guest);
  },

  saveCompany: (searchResultCompanyData) => {
    Company.findOne({ 'domain': searchResultCompanyData.raw_url }, (err, doc) => {
      if (err) { }
      else {
        if (doc) {
          doc.description = searchResultCompanyData.description;
          doc.logo = searchResultCompanyData.logo;
          doc.url = searchResultCompanyData.url;
          doc.save((err, doc, numAffected) => {
            // if (err) winston.error("Step 5 - Error updating company: " + err);
            // else winston.info("Step 5 - Updated company");
          })
        }
        else {
          let newCompanyObj = {
            domain: searchResultCompanyData.raw_url,
            name: searchResultCompanyData.name,
            description: searchResultCompanyData.description,
            logo: searchResultCompanyData.logo,
            url: searchResultCompanyData.url,
          }

          let newCompany = new Company(newCompanyObj);
          newCompany.save((err, doc, numAffected) => {
            // if (err) winston.error("Step 5 - Error saving company: " + err);
            // else winston.info("Step 5 - Created company");
          })
        }
      }
    })
  }
}

module.exports = voilanorbertAPIController;