/* eslint-disable linebreak-style */
const OutreachSequence = require('../models/outreach-sequence');
const EmailReport = require('../models/email-report');
const stageController = require('./stage');
const CustomError = require('../../common/errors/custom-error');
const stageConstants = require('../constants/stages');

const outreachSequenceController = {
  getAll: (userId, callback) => {
    OutreachSequence.find({ userId: userId, active: true }, (err, docs) => {
      if (err) callback(err);
      else {
        docs.forEach(element => {
          element.emailFrom = true;
          element.emailTo = true;
        });
        callback(null, docs);
      }
    })
  },


  getOutreachDetail: (req, callback) => {
    outreachSequenceController.getById(req.params.id, req.decoded.userId, (err, outreachSequence) => {
      if (err) callback(err);
      else
        if (outreachSequence)
          if (req.query.withStages && req.query.withStages === 'Y') {
            stageController.getStagesBySequence(req.params.id, (err, stages) => {
              if (err) callback(err);
              else {
                outreachSequence.stages = stages;
                // Check if there have been any messages in a conversation (emails with at least 1 reply)
                if (outreachSequence.currentStage !== stageConstants.WAITING &&
                  outreachSequence.currentStage !== stageConstants.SENT &&
                  outreachSequence.currentStage !== stageConstants.OPENED) {
                  stageController.checkConversation(outreachSequence, null, (err, convSequence) => {
                    if (err) callback(err);
                    else {
                      outreachSequenceController.updateOutreachSequence(convSequence._id, { currentMessage: convSequence.currentMessage }, (err) => {
                        if (err)
                          callback(err);
                        else
                          callback(null, convSequence);
                      })
                    }
                  })
                }
                else
                  callback(null, outreachSequence);
              }
            })
          }
          else
            callback(null, outreachSequence);
        else
          callback(new CustomError("Not found", 404));
    })
  },

  getById: (seqId, userId, callback) => {
    OutreachSequence.findOne({ _id: seqId, userId: userId }).populate('userPodcastId').populate('userPodcastEpisodeId')
      .populate('userEventOrganizationId').populate('userConferenceId').populate('userBusinessId').populate('userMediaOutletId').populate('userGuestId').lean().exec((err, doc) => {
        if (err) callback(err);
        else callback(null, doc);
      })
  },

  createOutreachSequence: (outreachSequence, callback) => {
    let newOutreachSequence = new OutreachSequence(outreachSequence);
    newOutreachSequence.save((err, doc) => {
      if (err)
        return callback(err);

      const newStage = {
        sequence: doc._id,
        category: stageConstants.WAITING,
        userId: outreachSequence.userId,
        teamId: outreachSequence.teamId,
        listId: outreachSequence.listId,
        listItemId: outreachSequence.listItemId
      };
      stageController.createStage(newStage, err => {
        if (err)
          return callback(err);

        callback(null, doc);
      })
    })
  },

  deleteOutreachSequence: (outreachId, userId, callback) => {
    OutreachSequence.findOneAndRemove({ _id: outreachId, userId: userId }, err => {
      if (err) callback(err);
      else
        stageController.deleteStagesFromSequence(outreachId, callback);
    });
  },

  updateOutreachSequence: (outreachId, updateObj, callback) => {
    OutreachSequence.findByIdAndUpdate(outreachId, updateObj, callback);
  },

  getEmailReport: (req, callback) => {
    EmailReport.findOne({ outreachId: req.params.id }, (err, report) => {
      if (err) callback(err);
      else if (!report) callback(new CustomError('Not found', 404));
      else callback(null, report);
    })
  },

  createEmailReport: (req, callback) => {
    const newEmailReport = new EmailReport(req.body);
    newEmailReport.save(callback);
  },

  addNote: (req, callback) => { 
    
    OutreachSequence.findOne({ _id: req.params.id }, (err, sequence) => {
      if (err) callback(err);
      else if (!sequence) callback(new CustomError('Not found', 404));
      else{
        let notes = sequence.notes || [];
        notes.push(req.body)

        OutreachSequence.findOneAndUpdate({ _id: req.params.id}, 
          { notes: notes }, err => {
          if (err) callback(err);
          else
            callback(null, sequence);
        })
      } 
    })
  },

  editNote: (req, callback) => { 

    OutreachSequence.findOne({ _id: req.params.id }, (err, sequence) => {
      if (err) callback(err);
      else if (!sequence) callback(new CustomError('Not found', 404));
      else{

        OutreachSequence.findOneAndUpdate(
          { "_id": req.params.id, "notes._id": req.params.idNote}, 
          {
            "$set": {
              "notes.$.content": req.body.content,
              "notes.$.title": req.body.title,
              "notes.$.date": req.body.date,
              "notes.$.editDate": req.body.editDate
            }
          }, err => {
            if (err) callback(err);
            else
              callback(null, sequence);
          }
        )
      } 
    })
  },

  removeNote: (req, callback) => { 
    OutreachSequence.findOne({ _id: req.params.id }, (err, sequence) => {
      if (err) callback(err);
      else if (!sequence) callback(new CustomError('Not found', 404));
      else{
        sequence.notes.id(req.params.idNote).remove();
        sequence.save(function (err) {
          
          if (err){
            console.log(err);
            callback(err);
          }
          else callback(null, "Note removed successfully");
        });
      } 
    })
  }
};

module.exports = outreachSequenceController;
