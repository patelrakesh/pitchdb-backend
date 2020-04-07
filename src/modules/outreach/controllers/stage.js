const async = require('async');

const Stage = require('../models/stage');
const Open = require('../models/open');
const OutreachSequence = require('../models/outreach-sequence');
const EmailAccount = require('../../users/models/email-account');

const mailController = require('../controllers/mail');
const gmailController = require('../controllers/gmail');
const outlookController = require('../controllers/outlook');
const emailLookUpController = require('../controllers/email-lookup');
const creditController = require('../../credits/controllers/credit');
const stageConstants = require('../constants/stages');

const mailConstants = require('../constants/mail');

const CustomError = require('../../common/errors/custom-error');
const errorConstants = require('../../common/errors/constants');
const winston = require('winston');

const stageController = {
  getStagesBySequence: (sequenceId, callback) => {
    Stage.find({ sequence: sequenceId }).sort('-date').exec((err, docs) => {
      if (err) callback(err);
      else callback(null, docs);
    })
  },

  createStage: (stage, callback) => {
    // Preemtive deletion of fields in case the new stage object was created from an existing field with id and date.
    // The id and date should be assigned by mongoose 
    delete stage._id;
    delete stage.date;
    let newStage = new Stage(stage);
    newStage.save((err, doc) => {
      if (err)
        callback(err);
      else {
        stageController.advanceStage(stage.sequence, stage.category, (err) => {
          if (err) callback(err);
          else callback(null, doc);
        })
      }
    })
  },

  // Changes the current stage of the outreach sequence document stored in the db
  advanceStage: (sequenceId, newStage, callback) => {
    let updateObj = {};
    if (newStage === stageConstants.WAITING)
      callback();
    else {
      if (newStage !== stageConstants.CONVERSED)
        updateObj.currentStage = newStage;

      // Sets the amount of messages that have been exchanged in an email conversation
      if (newStage === stageConstants.REPLIED || newStage === stageConstants.CONVERSED)
        updateObj.$inc = { 'currentMessage': 1 };

      OutreachSequence.findOneAndUpdate({ _id: sequenceId }, updateObj, (err, doc) => {
        if (err)
          callback(err);
        else
          callback(null, doc);
      });
    }
  },

  getLatestStagesBycategory: (category, userId, callback) => {
    OutreachSequence.find({ userId: userId, currentStage: category, active: true }).sort('date').populate('userPodcastId').populate('userPodcastEpisodeId')
      .populate('userEventOrganizationId').populate('userBusinessId').populate('userMediaOutletId').populate('userConferenceId').populate('userGuestId').exec((err, docs) => {
        if (err) callback(err);
        else {
          let sequencesWithCategory = [];
          docs.forEach(element => {
            let objSequence = element.toObject();
            objSequence.category = category;
            sequencesWithCategory.push(objSequence);
          });

          async.map(sequencesWithCategory, findLatestInSequenceByCategory, (err, result) => {
            if (err)
              callback(err);
            else
              callback(null, result);
          })
        }
      })
  },

  sendOutreachEmail: (user, stage, openId, callback) => {

    checkEmailAccountValidity(stage.sequence.emailAccountId, (err, emailAccount) => {
      if (err) {
        setInvalidEmailAccount(stage.sequence.emailAccountId);
        callback(new CustomError("Email account error", 530));
      }
      else {
        emailLookUpController.verifyWithChecker(stage.sequence, (err, verification) => {
          if (err) callback(err)
          else {
            if (verification === 'risky' || verification === 'deliverable') {
              let emailData = stage.content;
              emailData.from = stage.sequence.emailFrom;
              emailData.to = stage.sequence.emailTo;
              emailData.senderName = user.name;
              emailData.openId = openId;
              mailController.sendEmail(emailData, emailAccount, (err, data) => {
                if (err) {
                  setInvalidEmailAccount(stage.sequence.emailAccountId);
                  callback(new CustomError(errorConstants.EMAIL_ACCOUNT_ERROR, errorConstants.STATUS_EMAIL_ACCOUNT_ERROR));
                }
                else
                  callback(null, data);
              });
            }
            else {
              callback("Verification error");
            }
          }
        })
      }
    })
  },

  checkOpened: (stage, callback) => {
    Open.findOne({ outreachId: stage.sequence._id }, (err, open) => {
      if (err) callback(err);
      else {
        stage.dateOpened = open.dateOpened;
        callback(null, stage);
      }
    });
  },

  /*
  * Checks the latest email in a thread (conversation) to see if it is new and update the outreach sequence stages with it
  */
  checkLatestInThread: (stage, callback) => {
    checkEmailAccountValidity(stage.sequence.emailAccountId, (err, emailAccount) => {
      if (err) {
        setInvalidEmailAccount(stage.sequence.emailAccountId);
        callback(new CustomError(errorConstants.EMAIL_ACCOUNT_ERROR, errorConstants.STATUS_EMAIL_ACCOUNT_ERROR));
      }
      else {
        if (emailAccount)
          mailController.getEmailConversation(stage.content, emailAccount, (err, thread) => {
            if (err) {
              setInvalidEmailAccount(stage.sequence.emailAccountId);
              callback(new CustomError(errorConstants.EMAIL_ACCOUNT_ERROR, errorConstants.STATUS_EMAIL_ACCOUNT_ERROR));
            }
            else {
              stage.replyEmail = checkForReply(emailAccount.network, thread, stage.sequence.currentMessage);
              callback(null, stage);
            }
          });
        else
          callback(new CustomError(errorConstants.EMAIL_ACCOUNT_ERROR, errorConstants.STATUS_EMAIL_ACCOUNT_ERROR));
      }
    })
  },


  /*
  * Replies that are a bounce lead to one credit being refunded.
  * If this reply comes after the first one, the outreach sequence stage is "conversed"
  */
  processReply: (stage, callback) => {
    let newStage;
    let called;
    if (stage.replyEmail) {
      stageController.checkBounce(stage.replyEmail.from, (err, bounced) => {
        if (err) {
          called = true;
          callback(err);
        }
        else if (bounced) {
          creditController.refundCredit(stage.userId, stage.teamId, stage.sequence._id, (err) => {
            if (err) {
              winston.error(err);
            }
          })
          newStage = {
            sequence: stage.sequence._id,
            category: stageConstants.BOUNCED
          };
        }
        else {
          newStage = {
            ...stage,
            sequence: stage.sequence._id,
            category: stage.sequence.emailFrom !== stage.replyEmail.from ? stageConstants.REPLIED : stageConstants.CONVERSED,
            content: {
              subject: stage.replyEmail.subject,
              message: stage.replyEmail.message,
              recipient: stage.sequence.emailFrom !== stage.replyEmail.from,
              emailData: {
                id: stage.replyEmail.id,
                threadId: stage.replyEmail.threadId,
                snippet: stage.replyEmail.snippet,
                date: stage.replyEmail.date
              }
            }
          };
        }
      })
    }
    if (!called) callback(null, newStage);
  },

  deleteStagesFromSequence: (outreachId, callback) => {
    Stage.deleteMany({ sequence: outreachId }, callback);
  },

  checkConversation: (sequence, thread, callback) => {
    let protoStage = {};
    if (!thread) {
      let latestReplyStage;

      // Only check for new messages if the stage was replied at least once
      for (let i = sequence.stages.length - 1; i >= 0 && !latestReplyStage; i--) {
        const stage = sequence.stages[i];
        if (stage.category === stageConstants.REPLIED || stage.category === stageConstants.CONVERSED)
          latestReplyStage = stage;
      }
      if (!latestReplyStage)
        callback(null, sequence);
      else
        checkEmailAccountValidity(sequence.emailAccountId, (err, emailAccount) => {
          if (err) {
            setInvalidEmailAccount(latestReplyStage.sequence.emailAccountId);
            callback(new CustomError(errorConstants.EMAIL_ACCOUNT_ERROR, errorConstants.STATUS_EMAIL_ACCOUNT_ERROR));
          }
          else
            mailController.getEmailConversation(latestReplyStage.content, emailAccount, (err, fetchedThread) => {
              if (err) {
                setInvalidEmailAccount(latestReplyStage.sequence.emailAccountId);
                callback(new CustomError(errorConstants.EMAIL_ACCOUNT_ERROR, errorConstants.STATUS_EMAIL_ACCOUNT_ERROR));
              }
              else {
                protoStage.replyEmail = checkForReply(emailAccount.network, fetchedThread, sequence.currentMessage);
                if (protoStage.replyEmail)
                  createConversationStage(sequence, protoStage, (err, newStage) => {
                    if (err) callback(err);
                    else {
                      sequence.currentMessage++;
                      sequence.stages.unshift(newStage);
                      stageController.checkConversation(sequence, fetchedThread, callback);
                    }
                  })
                else {
                  callback(null, sequence);
                }
              }
            });
        });
    }
    else {
      EmailAccount.findById(sequence.emailAccountId, (err, emailAccount) => {
        if (err) callback(err)
        else {
          protoStage.replyEmail = checkForReply(emailAccount.network, thread, sequence.currentMessage);
          if (protoStage.replyEmail)
            createConversationStage(sequence, protoStage, (err, newStage) => {
              if (err) callback(err);
              else {
                sequence.currentMessage++;
                sequence.stages.unshift(newStage);
                stageController.checkConversation(sequence, thread, callback);
              }
            })
          else {
            callback(null, sequence);
          }
        }
      })
    }
  },

  checkBounce: (email, callback) => {
    // Verification for gmail, gotta do more for other providers later
    let bounced = false;
    if (email) {
      bounced = email.indexOf("mailer-daemon@googlemail.com") !== -1;
    }
    callback(null, bounced);
  }
};

const checkForReply = (network, conversation, currentMessage) => {
  let reply;
  if (conversation && currentMessage)
    switch (network) {
      case mailConstants.OUTLOOK:
        reply = outlookController.checkConversationForReply(conversation, currentMessage);
        break;
      case mailConstants.GMAIL:
        reply = gmailController.checkPayloadForReply(conversation, currentMessage);
        break;
      default:
        reply = null;
        break;
    }

  return reply;
}

const findLatestInSequenceByCategory = (outreachSequence, callback) => {
  Stage.findOne({ sequence: outreachSequence._id, category: outreachSequence.category }, (err, doc) => {
    if (err)
      callback(err);
    else {
      if (doc) {
        let modifiedStage = doc.toObject();
        modifiedStage.sequence = outreachSequence;
        callback(null, modifiedStage);
      }
      else {
        callback();
      }
    }
  })
}

const checkEmailAccountValidity = (accountId, callback) => {
  EmailAccount.findById(accountId, (err, emailAccount) => {
    if (err || !emailAccount) callback(err ? err : new CustomError("No email account found"));
    else
      mailController.checkTokenValidity(emailAccount, callback);
  });
}

const createConversationStage = (sequence, stage, callback) => {
  let newStage = new Stage({
    sequence: sequence,
    category: stageConstants.CONVERSED,
    content: {
      recipient: sequence.emailFrom !== stage.replyEmail.from,
      subject: stage.replyEmail.subject,
      message: stage.replyEmail.message,
      emailData: {
        id: stage.replyEmail.id,
        threadId: stage.replyEmail.threadId,
        snippet: stage.replyEmail.snippet,
        date: stage.replyEmail.date
      }
    }
  })
  newStage.save(callback);
}

const setInvalidEmailAccount = accountId => {
  EmailAccount.findByIdAndUpdate(accountId, { invalid: true }, (err) => {
    if (err) winston.error(err);
  });
}

module.exports = stageController;