const creditController = require('../../credits/controllers/credit');
const counterController = require('../../credits/controllers/counter');
const openController = require('./open');
const stageController = require('./stage');
const OutreachSequence = require('../models/outreach-sequence');
const CustomError = require('../../common/errors/custom-error');
const errorConstants = require('../../common/errors/constants');
const stageConstants = require('../constants/stages');

const async = require('async');
const winston = require('winston');

const stageActionsController = {

  stageSend: (req, callback) => {


    // Create an "open" document in the database to track if the recipient opens the sent email message
    openController.createFromOutreachSequence(req.body.sequence._id, (err, open) => {
      if (err) callback(err);
      else
        stageController.sendOutreachEmail(req.decoded, req.body, open._id, (err, emailData) => {
          if (err) {
            if (err === "Verification error") {
              callback(new CustomError("Verification error", errorConstants.STATUS_FAILED_SEND_LOOKUP))
            }
            else {
              callback(err);
            }
          }
          else {
            // After the email has been sent, reduce the user's credit count by one
            afterSendCreateStage(req, emailData, callback);
          }
        })
    })

  },

  stageOpen: (req, callback) => {
    // Checks multiple stages at once
    async.mapSeries(req.body, stageController.checkOpened, (err, stageOpens) => {
      if (err) callback(err);
      else {
        let newStages = [];
        stageOpens.forEach(stageOpen => {

          // An email is considered "opened by the recipient" if the date property has a value 
          if (stageOpen.dateOpened)
            newStages.push({
              ...stageOpen,
              sequence: stageOpen.sequence._id,
              category: stageConstants.OPENED,
              content: {
                dateOpened: stageOpen.dateOpened,
                emailData: {
                  id: stageOpen.content.emailData.id,
                  threadId: stageOpen.content.emailData.threadId
                }
              }
            });
        });
        async.map(newStages, stageController.createStage, (err, createdStages) => {
          if (err) callback(err)

          // If an email was opened, there is a chance it was replied aswell, check is performed for those cases
          else checkOpenedStagesReplies(req, stageOpens, createdStages, callback)
        })
      }
    })
  },

  // Check latest replies and check for bounces
  stageReply: (req, callback) => {
    async.mapSeries(req.body, stageController.checkLatestInThread, (err, checkedStages) => {
      if (err) callback(err);
      else {
        checkedStages.forEach(checkedStage => {
          checkedStage.user = req.decoded;
        });
        async.mapSeries(checkedStages, stageController.processReply, (err, processedStages) => {
          if (err) callback(err);
          else {
            let newStages = [];
            processedStages.forEach(stage => {
              if (stage) newStages.push(stage);
            });
            async.map(newStages, stageController.createStage, (err, results) => {
              if (err) callback(err);
              else
                callback(null, results);
            })
          }
        })
      }
    })
  },

  stageBook: (req, callback) => {
    stageController.createStage({
      userId: req.decoded.userId,
      teamId: req.decoded.teamId,
      listId: req.body.listId,
      sequence: req.body._id,
      category: stageConstants.BOOKED
    }, callback)
  },

  stagePostpone: (req, callback) => {
    stageController.createStage({
      userId: req.decoded.userId,
      teamId: req.decoded.teamId,
      sequence: req.body._id,
      listId: req.body.listId,
      category: stageConstants.POSTPONED,
      content: { lastStage: req.body.currentStage }
    }, callback)
  },

  stageRestore: (req, callback) => {
    let category;
    for (let i = 0; i < req.body.stages.length && !category; i++) {
      const stage = req.body.stages[i];
      if (stage.category === stageConstants.POSTPONED)
        category = stage.content.lastStage;
    }
    OutreachSequence.findOneAndUpdate({ _id: req.body._id, userId: req.decoded.userId }, { currentStage: category }, callback);
  }
}

const afterSendCreateStage = (req, data, callback) => {
  let reqStage = req.body;
  let newStage = {
    ...reqStage,
    content: {
      ...data,
      subject: reqStage.content.subject,
      message: reqStage.content.message
    },
    sequence: reqStage.sequence._id,
    category: stageConstants.SENT
  };
  stageController.createStage(newStage, (err, stage) => {
    if (err) callback(err)
    else callback(null, stage);
  })
}

const checkOpenedStagesReplies = (req, opens, createdStages, callback) => {
  async.map(opens, stageController.checkLatestInThread, (err, checkedStages) => {
    if (err) {
      winston.error(err);
      callback(err)
    }
    else {

      async.mapSeries(checkedStages, stageController.processReply, (err, processedStages) => {
        if (err) {
          winston.error(err);
          callback(err)
        }
        else {
          let newStages = [];
          let bounced = false;
          processedStages.forEach(stage => {
            if (stage) {
              newStages.push(stage);
              if (stage.category === stageConstants.BOUNCED)
                bounced = true;
            }
          });
          async.map(newStages, stageController.createStage, (err) => {
            if (err) {
              callback(err);
              winston.error(err);
            }
            callback(null, { stages: createdStages, bounced: bounced })
          })
        }
      })
    }
  })
}

module.exports = stageActionsController;