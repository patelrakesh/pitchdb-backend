const Counter = require('../models/counter');
const Credit = require('../models/credit');

const counterController = {
  get: (userId, teamId, callback) => {
    if (!teamId)
      Counter.findOne({ userId: userId }, callback);
    else
      Counter.findOne({ teamId: teamId }, callback);
  },

  getByTeam: (teamId, callback) => {
    Counter.findOne({ teamId: teamId }, callback);
  },

  createCounter: (userId, teamId, callback) => {
    let newCounter = new Counter({
      userId: userId,
      teamId: teamId
    })

    newCounter.save(err => {
      if (err)
        callback(err)
      else {
        let newCreditsArray = [];
        for (let index = 0; index < 5; index++) {
          newCreditsArray.push({
            userId: userId,
            teamId: teamId
          })
        }
        Credit.insertMany(newCreditsArray, callback)
      }
    })
  }
};

module.exports = counterController;