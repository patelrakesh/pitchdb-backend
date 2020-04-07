const Guest = require('../models/guest');
const Company = require('../models/company');

const clearbitAPIController = require('./people-lookup/clearbit-api');
const snovAPIController = require('./people-lookup/snov-api');
const checkerAPIController = require('./people-lookup/checker-api');
const hunterAPIController = require('./people-lookup/hunter-api');
const voilanorbertAPIController = require('./people-lookup/voilanorbert-api');

const async = require('async');
const mongoose = require('mongoose');

/*
* The lookup uses many APIs in an attemp to find the email of a person, given the name and company/domain.
* The process is described further below in the async waterfall setup
*/

const peopleLookupController = {

  lookupEmails: (req, callback) => {
    let prospectsForLookUp = req.body;

    async.mapSeries(prospectsForLookUp, peopleLookupController.findGuestEmail, (err, results) => {
      if (err) callback(err);
      else {
        let resultsArray = [];
        results.forEach(element => {
          if (element) {
            let reElement = (element instanceof mongoose.Model) ? element.toObject() : element;
            if (element.email) {
              reElement.hasEmail = true;
              reElement.email = null;
            }
            else
              reElement.hasEmail = false;
            resultsArray.push(reElement);
          }
        });
        callback(null, resultsArray);
      }
    });
  },

  findGuestEmail: (guest, next) => {

    //winston.info("============================================ Principal - New search initiated for " + guest.name);

    let firstLastName = getFirstLastName(guest.name, 0);
    guest.firstName = firstLastName.firstName;
    guest.lastName = firstLastName.lastName;
    guest.fullName = guest.name;

    async.waterfall([
      // 1. Try finding in database
      async.apply(dbEmailFinder.findInDB, guest),
      // 2. Find domains from company
      clearbitAPIController.findDomain,
      // 3. Try finding with Snov API
      snovAPIController.getGuestEmail,
      // 4. Try finding with SMTP verification (First attempt)
      checkerAPIController.findByVerification,
      // 5. Try finding with Hunter API 
      hunterAPIController.findByCompanyDomain,
      // 6. Try finding with SMTP verification (Second attempt)
      checkerAPIController.findByVerification,
      // 7. Try finding with Norbert API
      voilanorbertAPIController.findByPerson,
      // 8. Do email verification with Hunter
      hunterAPIController.verifyEmail
    ], (err, result) => {
      //winston.info("Principal - process complete");
      let newGuest;
      if (err)
        newGuest = guest;
      else {
        if (result.email && result._id) {
          //winston.info("Principal - Email found");
          next(null, result);
          return;
        }
        else {
          newGuest = result;
        }
      }
      if (!newGuest._id) {

        let persisGuest = new Guest(newGuest);
        persisGuest.save((err, doc) => {
          if (err) {
            //winston.error("Principal - Error saving new guest: " + err);
            next(null, newGuest);
          }
          else {
            next(null, doc);
          }
        });
      }
      else {
        next(null, newGuest);
      }
    });
  }
};

const generatePatterns = (fname, lname, domain) => {
  let results = [];
  fname = fname.replace(/[^0-9a-zA-Z._-]/g, '').toLowerCase();
  lname = lname.replace(/[^0-9a-zA-Z._-]/g, '').toLowerCase();
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

const getFirstLastName = (name, attempt) => {

  let splitName = name.trim().split(" ");
  let firstLastName = { firstName: splitName[0] }
  if (splitName.length === 2) {
    firstLastName.twoNames = true;
    firstLastName.lastName = splitName[1];

  }
  else if (splitName.length % 2 === 0) {
    firstLastName.twoNames = false;
    firstLastName.lastName = splitName[splitName.length / 2];

  }
  else if (attempt === 0) {
    firstLastName.twoNames = false;
    firstLastName.lastName = splitName[Math.ceil(splitName.length / 2)];
  }

  else {
    firstLastName.twoNames = false;
    firstLastName.lastName = splitName[Math.floor(splitName.length / 2)];
  }

  return firstLastName;
}

/**
 * SEARCH ONLY USING THE DATABASE
 * There is the possibility of searching by 5 different combinations
 * ====== If no domain is present, attempt to get from company collection
 * 1. firstName, secondName and domain
 * 2. fullName and domain
 * 3. firstName, secondName and company name
 * 4. fullName and company name 
 * 5. firstName, secondName and domain, using the email pattern generator
 **/
const dbEmailFinder = {

  findInDB (guest, next) {
    //winston.info("Step 1");
    let gue = guest;
    async.waterfall([
      // Try to find with 5 different approaches
      async.apply(dbEmailFinder.getCompanyDomain, guest),
      dbEmailFinder.attempToFindInDB,
      dbEmailFinder.attempToFindInDB,
      dbEmailFinder.attempToFindInDB,
      dbEmailFinder.attempToFindInDB,
      dbEmailFinder.attempToFindInDB,
      dbEmailFinder.attempToFindInDB,
      dbEmailFinder.attempToFindInDB
    ], (err, result) => {
      let nextGuest = gue;
      if (err) {
        //winston.error("Step 1 - Error attemp to find in db: " + err);
      }
      else {
        if (result)
          nextGuest = result;
      }
      next(null, nextGuest);
    });
  },

  getCompanyDomain (guest, next) {
    let gue = guest;
    if (!guest.domain) {
      Company.findOne({ 'name': guest.company }, (err, doc) => {
        if (err) {
          //winston.error("Step 1 - Error finding company: " + err);
        }
        else {
          if (doc) gue.domain = doc.domain;
        }
        next(null, gue, 1);
      })
    }
    else
      next(null, guest, 1);
  },

  attempToFindInDB (guest, attempt, next) {
    if (!guest.email) {
      let query;

      let queryDomain = guest.domain ? guest.domain.trim() : guest.domain;
      let queryFirstName = guest.firstName ? guest.firstName.trim() : guest.firstName;
      let queryLastName = guest.lastName ? guest.lastName.trim() : guest.lastName;
      let queryFullName = guest.name ? guest.name.trim() : guest.name;
      let queryCompany = guest.company ? guest.company.trim() : guest.company;

      if (attempt === 1 && queryDomain)
        query = {
          domain: queryDomain,
          firstName: queryFirstName,
          lastName: queryLastName
        }
      else if (attempt === 2 && queryDomain)
        query = {
          domain: queryCompany,
          fullName: queryFullName,
        }
      else if (attempt === 3)
        query = {
          company: queryCompany,
          firstName: queryFirstName,
          lastName: queryLastName
        }
      else if (attempt === 4)
        query = {
          company: queryCompany,
          fullName: queryFullName
        }
      else if (attempt === 5 && queryFirstName && queryLastName && queryDomain)
        query = {
          email: { $in: generatePatterns(queryFirstName, queryLastName, queryDomain) }
        }

      if (query) {
        let gue = guest;
        Guest.findOne(query).lean().exec((err, doc) => {
          if (err) {
            //winston.error("Step 1 - Error finding guest: " + err);
          }
          else {
            if (doc) {
              Object.assign(gue, doc);
              gue.foundDb = true;
            }
          }
          next(null, gue, ++attempt);
        });
      }
      else
        next(null, guest, ++attempt);
    }
    else
      next(null, guest, ++attempt);
  }
}

module.exports = peopleLookupController;