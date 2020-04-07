const CHECKER_API_BASE_URL = 'https://api.thechecker.co/v1/verify';
const axios = require('axios');
const Guest = require('../../models/guest');

const winston = require('winston');
const async = require('async');

/**
 * SEARCH ONLY USING CHECKER API VERIFICATION
 * 1. Build possible emails
 * 2. Make API call
 */

const checkerAPIController = {
  findByVerification: (guest, attempted, next) => {
    //winston.info("Step 2 & 4");
    let gue = guest;
    if (!guest.email && guest.domain && !attempted) {
      let possibleEmails = generatePatterns(guest.firstName, guest.lastName, guest.domain);
      async.waterfall([
        // Try to find with 6 different email combinations
        async.apply(checkerAPIController.verifyEmail, guest, 0, possibleEmails),
        checkerAPIController.verifyEmail,
        checkerAPIController.verifyEmail,
        checkerAPIController.verifyEmail,
        checkerAPIController.verifyEmail,
        checkerAPIController.verifyEmail
      ], (err, result) => {
        if (err) {
          //winston.error("Step 2 & 4 - Error verification process: " + err);
          next(null, gue, 0, true);
        }
        else {
          if (result.email) {
            //winston.info(result);
            let newGuestObj = {
              email: result.email,
              firstName: result.firstName,
              lastName: result.lastName,
              fullName: result.name,
              company: result.company,
              domain: result.domain,
              jobTitle: gue.jobTitle,
              location: result.location,
              verification: result.verification,
              image: gue.image,
              obtentionMethod: "checker"
            }

            // Clean guest
            let objProperties = Object.keys(newGuestObj);
            objProperties.forEach(element => {
              if ((typeof newGuestObj[element] === 'string' && newGuestObj[element].includes("null")) || !newGuestObj[element])
                delete newGuestObj[element];
            });

            Object.assign(result, newGuestObj);

            let newGuest = new Guest(newGuestObj);
            newGuest.save((err, doc) => {
              if (err) {
                //winston.error("Step 2 & 4 - Error persisting: " + err);
                next(null, gue, 0, true);
              }
              else {
                //winston.info("Step 2 & 4 - New guest added, via verification");
                next(null, doc, 0, true);
              }
            })
          }
          else {
            //winston.error("Step 2 & 4 - No result: " + err);
            next(null, gue, 0, true);
          }
        }
      });
    }
    else {
      next(null, guest, 0, false);
    }

  },

  verifyEmail: (guest, attempt, emails, next) => {
    if (!guest.email || (guest.email && ((guest.verification && guest.verification !== 'deliverable') || !guest.confidence))) {
      let queryParams = "api_key=" + process.env.CHECKER_API_KEY;
      queryParams += "&email=" + emails[attempt];
      let posEmails = emails;
      let gue = guest;
      axios.get(CHECKER_API_BASE_URL + '?' + queryParams)
        .then(response => {
          let verification = response.data;
          // Store in db
          let update = false;
          if (verification.result !== 'undeliverable') {
            if (!gue.verification && (verification.result === 'risky' || verification.result === 'deliverable'))
              update = true;
            else if (gue.verification === 'risky' && verification.result === 'deliverable')
              update = true;
          }
          if (update) {
            gue.email = verification.email;
            gue.verification = verification.result;
          }
          next(null, gue, ++attempt, posEmails);
        })
        .catch(error => {
          //winston.error("Step 2 & 4 - No individual result: " + error);
          next(null, gue, ++attempt, posEmails);
        });
    }
    else {
      next(null, guest, ++attempt, emails);
    }

  }
}

const generatePatterns = (fname, lname, domain) => {
  let results = [];
  fname = fname.replace(/[^0-9a-zA-Z\._-]/g, '').toLowerCase();
  lname = lname.replace(/[^0-9a-zA-Z\._-]/g, '').toLowerCase();
  domain = domain.toLowerCase();

  results.push(fname + lname + "@" + domain);
  results.push(fname[0] + lname + "@" + domain);
  results.push(fname[0] + "." + lname + "@" + domain);
  results.push(lname + fname + "@" + domain);
  results.push(fname + "." + lname + "@" + domain);
  results.push(lname + "." + fname + "@" + domain);
  results.push(fname + "@" + domain);
  results.push(lname + "@" + domain);

  return results;
}

module.exports = checkerAPIController;