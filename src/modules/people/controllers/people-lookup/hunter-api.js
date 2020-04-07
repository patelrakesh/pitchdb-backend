const HUNTER_API_BASE_URL = 'https://api.hunter.io/v2';
const MAX_EMAIL_RECORDS = 10;

const Guest = require('../../models/guest');
const Company = require('../../models/company');
const winston = require('winston');

const axios = require('axios');

/**
 * SEARCH ONLY USING HUNTER API
 * 1. firstName, secondName and domain
 * 2. fullName and domain
 * 3. firstName, secondName and company name
 * 4. fullName and company name 
 **/

const hunterAPIController = {
  findByCompanyDomain: (guest, attempt, verificationAttempted, next) => {
    //winston.info("Step 3");
    if (!guest.email) {
      let queryParams = "api_key=" + process.env.HUNTER_API_KEY;
      if (guest.domain) queryParams += "&domain=" + guest.domain;
      if (!guest.domain) queryParams += "&company=" + guest.company;
      queryParams += "&limit=" + MAX_EMAIL_RECORDS;
      queryParams += "&offset=" + (100 * attempt);
      let gue = guest;
      let didAttemp = verificationAttempted;
      axios.get(HUNTER_API_BASE_URL + '/domain-search?' + queryParams)
        .then(response => {
          let totalResults = response.data.meta.results;
          if (attempt === 0 && totalResults > 0 && !gue.domain) {
            let gueResponse = response.data.data.emails[0];
            if (gueResponse.type === 'personal') {
              let companyDomain = gueResponse.value.substring(gueResponse.value.indexOf("@") + 1)
              let newDomain = new Company({
                name: gue.company,
                domain: companyDomain
              });
              gue.domain = companyDomain;
              newDomain.save((err) => {
                // if (err) winston.error("Step 3 - Company save error: " + err);
                // else winston.info("New company");
              })
            }
          }

          response.data.data.emails.forEach(element => {
            if (element.type === 'personal') {

              let newGuestObj = {
                email: element.value,
                firstName: element.first_name,
                lastName: element.last_name,
                fullName: element.first_name + " " + element.last_name,
                company: gue.company,
                location: gue.location,
                jobTitle: element.jobTitle,
                confidence: element.confidence,
                source: element.sources[0].uri,
                domain: element.value.substring(element.value.indexOf("@") + 1),
                obtentionMethod: "hunter"
              }

              if (element.first_name === gue.firstName && element.last_name === gue.lastName) {
                newGuestObj.image = gue.image;
              }

              // Clean guest
              let objProperties = Object.keys(newGuestObj);
              objProperties.forEach(element => {
                if ((typeof newGuestObj[element] === 'string' && newGuestObj[element].includes("null")) || !newGuestObj[element])
                  delete newGuestObj[element];
              });


              let newGuest = new Guest(newGuestObj);

              if (element.first_name === gue.firstName && element.last_name === gue.lastName) {
                //winston.info("Step 3 - Email found");
                Object.assign(gue, newGuestObj);
              }

              newGuest.save((err) => {
                // if (err) winston.error("Step 3 - Error adding guest: " + err);
                // else winston.info("Step 3 - New guest added, via hunter API");
              })
            }
          });
          if (false && attempt <= 0 && totalResults >= (100 * (attempt + 1))) {
            setTimeout(() => {
              hunterAPIController.findByCompanyDomain(gue, ++attempt, didAttemp, next);
            }, 2000);
          }
          else {
            next(null, gue, didAttemp);
          }


        })
        .catch(error => {
          //winston.error("Step 3 - Error hunter request: " + error);
          next(null, gue, didAttemp);
        });
    }
    else
      next(null, guest, verificationAttempted);
  },

  findByPerson: (guest, next) => {
    if (!guest.email) {
      let queryParams = "api_key=" + process.env.HUNTER_API_KEY;
      queryParams += "&first_name=" + guest.firstName;
      queryParams += "&last_name=" + guest.lastName;
      queryParams += "&company=" + guest.company;

      axios.get(HUNTER_API_BASE_URL + '/email-finder?' + queryParams)
        .then(response => {
          // Store in db
          next(null, response.data);

        })
        .catch(error => {
          next(error);
        });
    }
    else
      next(null, guest);
  },

  verifyEmail: (guest, next) => {
    //winston.info("Step 6");
    if (guest.email && !guest.confidence) {
      let queryParams = "api_key=" + process.env.HUNTER_API_KEY;
      queryParams += "&email=" + guest.email;
      let responseRecieved = false;
      let gue = guest;
      let tries = 0;
      let checkVerifyProgress = setInterval(() => {
        axios.get(HUNTER_API_BASE_URL + '/email-verifier?' + queryParams)
          .then(response => {
            tries++;
            if (response.status === 200 && !responseRecieved) {
              responseRecieved = true;
              clearInterval(checkVerifyProgress);
              gue.confidence = response.data.data.score;
              gue.verification = response.data.data.result;
              gue.webmail = response.data.data.webmail;
              gue.disposable = response.data.data.disposable;
              Guest.findOneAndUpdate({ email: gue.email }, gue, { new: true }, (err) => {
                // if (err) {
                //     winston.error("Step 6 - Error updating guest: " + err);
                // }
                // else {
                //     winston.info("Step 6 - Guest updated with confidence score");
                // }
                next(null, gue);
              })
            }
            else if (tries >= 20) {
              responseRecieved = true;
              clearInterval(checkVerifyProgress);
              //winston.error("Step 6 - Time ran out for verification");
              next(null, gue);
            }
          })
          .catch(error => {
            //winston.error("Step 6 - Error hunter request: " + error);
            clearInterval(checkVerifyProgress);
            responseRecieved = true;
            next(null, gue);
          })
      }, 2000);

    }
    else
      next(null, guest);
  }
}

module.exports = hunterAPIController;