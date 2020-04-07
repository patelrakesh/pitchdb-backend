/* eslint-disable linebreak-style */
let Credit = require('../models/credit');
let Counter = require('../models/counter');
const backErrorController = require('../../util/controllers/back-error');

module.exports = {

  addCredits: (userId, credits, callback) => {
    let creditsArray = [];
    for (let i = 0; i < credits.amount; i++) {
      creditsArray.push({
        userId: userId,
        bundleType: 'adminGift'
      })

    }

    Credit.insertMany(creditsArray, err => {
      if (err) {
        backErrorController.persistError({
          module: "adding gift credits",
          message: "Error persisting credits for u:" + userId + " bun:" + 'adminGift'
        });
        callback(err);
      }
      else {
        Counter.update({ userId: userId }, { $inc: { remaining: credits.amount } }, (err) => {
          if (err) {
            backErrorController.persistError({
              module: "adding gift credits",
              message: "Error updating counter for u:" + userId + " bun:" + 'adminGift'
            });
            callback(err);
          }
          else callback();
        })
      }
    });
  },

  obtainBundle: (userId, teamId, bundle, paymentId, callback) => {
    let creditsArray = [];
    for (let i = 0; i < bundle.amount; i++) {
      creditsArray.push({
        userId: userId,
        teamId: teamId,
        bundleType: paymentId ? bundle.type : 'adminGift',
        paymentId: paymentId
      })

    }

    Credit.insertMany(creditsArray, err => {
      if (err) {
        backErrorController.persistError({
          module: "buying bundle",
          message: "Error persisting credits for u:" + userId + " t:" + teamId + " bun:" + bundle.type + " payId:" + paymentId
        });
        callback(err);
      }
      else {
        Counter.update({ userId: userId }, { $inc: { remaining: bundle.amount } }, (err) => {
          if (err) {
            backErrorController.persistError({
              module: "buying bundle",
              message: "Error updating counter for u:" + userId + " t:" + teamId + " bun:" + bundle.type + " payId:" + paymentId
            });
            callback(err);
          }
          else callback();
        })
      }
    });
  },

  useCredit: (userId, teamId, outreachSequenceId, callback) => {

    Counter.findOne({ userId: userId}, null, function (err, counter) {
      if (err) return callback(err);
      else{
        if(counter.remaining === Number.POSITIVE_INFINITY){
          let findObj = { outreachSequenceId: null };
          if (teamId) findObj.teamId = teamId;
          else findObj.userId = userId;
          Credit.findOneAndUpdate(findObj, 
            { 
              bundleType: 'subscription', 
              subscription: true, 
              dateConsumed: new Date(), 
              outreachSequenceId: outreachSequenceId ,
              dateObtained: new Date()
            }, 
          {upsert: true })
            .sort('dateObtained').exec((err) => {
              // Erros involving credits are stored in the database for further inspection
              if (err) {
                backErrorController.persistError({
                  module: "using credit",
                  message: "Error updating credit for u:" + userId + " t:" + teamId + " outre:" + outreachSequenceId
                });
                callback(err);
              }
              else {
                updateCounterUseCredit(userId, teamId, outreachSequenceId, callback)
              }
            })
        }
        else{
          let findObj = { outreachSequenceId: null };
          if (teamId) findObj.teamId = teamId;
          else findObj.userId = userId;
          Credit.findOneAndUpdate(findObj, { dateConsumed: new Date(), outreachSequenceId: outreachSequenceId })
            .sort('dateObtained').exec((err) => {
              // Erros involving credits are stored in the database for further inspection
              if (err) {
                backErrorController.persistError({
                  module: "using credit",
                  message: "Error updating credit for u:" + userId + " t:" + teamId + " outre:" + outreachSequenceId
                });
                callback(err);
              }
              else {
                updateCounterUseCredit(userId, teamId, outreachSequenceId, callback)
              }
            })
        }
      }
    });

  },

  // Changes the state of the credit used for this outreach sequence so it can be used again
  refundCredit: (userId, teamId, outreachSequenceId, callback) => {
    let findObj = { outreachSequenceId: outreachSequenceId };
    if (teamId) findObj.teamId = teamId;
    else findObj.userId = userId;
    Credit.findOneAndUpdate(findObj, { dateLastRefund: new Date(), outreachSequenceId: null })
      .sort('dateObtained').exec((err) => {
        if (err) {
          backErrorController.persistError({
            module: "refunding credit",
            message: "Error updating credit for u:" + userId + " t:" + teamId + " outre:" + outreachSequenceId
          });
          callback(err);
        }
        else {
          let updateOBj = {};
          if (teamId) updateOBj.teamId = teamId;
          else updateOBj.userId = userId;
          Counter.update(updateOBj, { $inc: { used: -1, remaining: 1 } }, (err) => {
            if (err) {
              backErrorController.persistError({
                module: "using credit",
                message: "Error updating counter for u:" + userId + " t:" + teamId + " outre:" + outreachSequenceId
              });
              callback(err);
            }
            else callback();
          })
        }
      })
  }
};

const updateCounterUseCredit = (userId, teamId, outreachSequenceId, callback ) => {

  let updateOBj = {};
  if (teamId) updateOBj.teamId = teamId;
  else updateOBj.userId = userId;
  Counter.update(updateOBj, { $inc: { used: 1, remaining: -1 } }, (err) => {
    if (err) {
      backErrorController.persistError({
      module: "using credit",
      message: "Error updating counter for u:" + userId + " t:" + teamId + " outre:" + outreachSequenceId
      });
      callback(err);
    }
    else callback();
  })
}
