/* eslint no-unused-expressions: 0 */

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');

const stageActionsController = require('../../modules/outreach/controllers/stage-actions');
const staging = require('../../test-modules/common/util/staging');
const stageConstants = require('../../modules/outreach/constants/stages');

const testData = require('../../test-modules/data');

const mailController = require('../../modules/outreach/controllers/mail');
const gmailControllerStubs = require('../../test-modules/stubs/outreach/gmail');
const emailLookUpController = require('../../modules/outreach/controllers/email-lookup');
const emailLookUpControllerStubs = require('../../test-modules/stubs/outreach/email-lookup');
const stageController = require('../../modules/outreach/controllers/stage');
const stageControllerStubs = require('../../test-modules/stubs/outreach/stage');

const OutreachSequence = require('../../modules/outreach/models/outreach-sequence');
const Stage = require('../../modules/outreach/models/stage');
const Counter = require('../../modules/credits/models/counter');
const Credit = require('../../modules/credits/models/credit');

const server = require('../../app')
before(function (done) {
  this.timeout(60000);
  if (server.get('status') !== 'started')
    server.on("app_started", () => {
      done();
    })
  else
    done();
})

describe("Outreach sequences stages transition integration tests", function () {

  this.timeout(150000);

  after(done => {
    deleteDocuments(done);
  })

  describe("POST /action/send", () => {

    const TEST_SUBJECT = 'Test Subject';
    const TEST_MESSAGE = 'Test Message';

    before(done => {
      setupCommonData(done)
    })
    before(done => {
      setupOutreachSequences(stageConstants.WAITING, done)
    })

    let sendTestRequestObj = {}

    before(done => {
      sendTestRequestObj = {
        decoded: {
          userId: staging.data.users[0]._id
        },
        body: {
          ...staging.data.stages[0],
          sequence: staging.data.outreachSequences[0],
          content: {
            subject: TEST_SUBJECT,
            message: TEST_MESSAGE
          }
        }
      };

      // TODO: Create email accounts for testing, currently stubing the methods involved with emails
      sinon.stub(mailController, 'checkTokenValidity').callsFake(gmailControllerStubs.checkTokenValidity);
      sinon.stub(mailController, 'sendEmail').callsFake(gmailControllerStubs.sendEmail);
      sinon.stub(emailLookUpController, 'verifyWithChecker').callsFake(emailLookUpControllerStubs.verifyWithChecker);

      stageActionsController.stageSend(sendTestRequestObj, (err) => {
        if (err) {
          console.log(err);
          expect.fail("An error was thrown while sending the email", "It should not throw an error", "Email send failed");
          done();
        }
        else {
          done();
        }
      })
    })

    it('Should have changed the stage to "sent"', function (done) {
      performStageCategoryChangeTest(stageConstants.SENT, done);
    })

    // TODO: Add test email account an verify message from email client
    it('Should have sent an email with correct content', function (done) {
      Stage.findOne({ sequence: staging.data.outreachSequences[0]._id, category: stageConstants.SENT }, (err, stage) => {
        if (err) {
          console.log(err);
          expect.fail("An error was thrown while retrieving the stage", "It should not throw an error", "MongoDB retrieval failed");
          done();
        }
        else {
          expect(stage.content).to.exist;
          expect(stage.content.subject).to.equal(TEST_SUBJECT);
          expect(stage.content.message).to.equal(TEST_MESSAGE);
          done();
        }
      })
    })

    it('Should have consumed one credit', function (done) {
      Counter.findOne({ userId: staging.data.users[0]._id }, (err, counter) => {
        if (err) {
          console.log(err);
          expect.fail("An error was thrown while retrieving the counter", "It should not throw an error", "MongoDB retrieval failed");
          done();
        }
        else {
          expect(counter).to.exist;
          expect(counter.remaining).to.equal(4);
          Credit.findOne({ outreachSequenceId: staging.data.outreachSequences[0]._id }, (err, credit) => {
            if (err) {
              console.log(err);
              expect.fail("An error was thrown while retrieving the credit", "It should not throw an error", "MongoDB retrieval failed");
              done();
            }
            else {
              expect(credit).to.exist;
              done();
            }
          })
        }
      })
    })

  })

  describe("POST /action/opened", () => {

    before(done => {
      setupCommonData(done)
    })
    before(done => {
      setupOutreachSequences(stageConstants.SENT, done)
    })

    let openTestRequestObj = {}

    before(done => {
      
      openTestRequestObj = {
        decoded: {
          userId: staging.data.users[0]._id
        },
        body: [
          {
            ...staging.data.stages[0],
            sequence: staging.data.outreachSequences[0],
            content:{
              emailData:{
                id: 'ABCD1234',
                threadId: '1234ABCD'
              }
            }
          }
        ]
      };

      // Stubing the methods involved with emails
      sinon.stub(stageController, 'checkLatestInThread').callsFake(stageControllerStubs.checkLatestInThread);
      sinon.stub(stageController, 'processReply').callsFake(stageControllerStubs.processReply);

      stageActionsController.stageOpen(openTestRequestObj, (err) => {
        if (err) {
          console.log(err)
          expect.fail("An error was thrown while chekcing for opened stages", "It should not throw an error", "Stage check failed");
          done();
        }
        else {
          done();
        }
      })
    })

    it('Should have changed the stage to "opened"', function (done) {
      performStageCategoryChangeTest(stageConstants.OPENED, done);
    })
  })

  describe("POST /action/replied", () => {
    before(done => {
      setupCommonData(done);
    })
    before(done => {
      setupOutreachSequences(stageConstants.OPENED, done);
    })

    it('Should have changed the stage to "replied"', function () {

    })

  })

  describe("POST /action/book", () => {
    before(done => {
      setupCommonData(done);
    })
    before(done => {
      setupOutreachSequences(stageConstants.REPLIED, done);
    })

    it('Should have changed the stage to "booked"', function () {

    })

  })

  describe("POST /action/postpone", () => {
    before(done => {
      setupCommonData(done);
    })
    before(done => {
      setupOutreachSequences(stageConstants.REPLIED, done);
    })

    it('Should have changed the stage to "postponed"', function () {

    })

  })

  describe("POST /action/restore", () => {
    before(done => {
      setupCommonData(done);
    })
    before(done => {
      setupOutreachSequences(stageConstants.POSTPONED, done);
    })

    it('Should have changed the stage to "restored"', function () {

    })

  })
})

const setupCommonData = (done) => {
  staging.data = {};
  staging.deleteDocuments(['user', 'outreachSequence', 'stage', 'open',
    'userPodcast', 'podcast', 'emailAccount', 'team', 'counter', 'credit', 'payment'])
    .then(() => {
      return staging.insertDocuments(testData.users.basicUsers(), testData.users);
    })
    .then(() => {
      return staging.insertDocuments(testData.emailAccounts.basicAccounts(staging.data.users), testData.emailAccounts);
    })
    .then(() => {
      return staging.insertDocuments(testData.payments.basicPayments(staging.data.users), testData.payments);
    })
    .then(() => {
      return staging.insertDocuments(testData.counters.basicCounters(staging.data.users), testData.counters);
    })
    .then(() => {
      return staging.insertDocuments(testData.credits.basicCredits(staging.data.users, staging.data.payments), testData.credits);
    })
    .then(() => {
      return staging.insertDocuments(testData.podcasts.basicPodcasts(), testData.podcasts);
    })
    .then(() => {
      return staging.insertDocuments(testData.userPodcasts.basicUserPodcasts(staging.data.users, staging.data.podcasts), testData.userPodcasts);
    })
    .then(() => {
      done();
    })
    .catch((err) => {
      deleteDocuments();
      throw Error(err);
    })
}

const setupOutreachSequences = (stage, done) => {
  staging.insertDocuments(testData.outreachSequences.basicOutreachSequences(staging.data.users, staging.data.emailAccounts, staging.data.userPodcasts, stage), testData.outreachSequences)
    .then(() => {
      if (stage === stageConstants.SENT) {
        return new Promise((resolve, reject) => {
          staging.insertDocuments(testData.opens.basicOpens(staging.data.outreachSequences), testData.opens)
            .then(() => {
              return staging.insertDocuments(testData.stages.basicStages(staging.data.outreachSequences, stage), testData.stages);
            })
            .then(() => {
              resolve();
            })
            .catch(err => reject(err));
        })
      }
      else
        return staging.insertDocuments(testData.stages.basicStages(staging.data.outreachSequences, stage), testData.stages);
    })
    .then(() => {
      done();
    })
    .catch((err) => {
      deleteDocuments();
      throw Error(err);
    })
}

const deleteDocuments = (done) => {
  staging.deleteDocuments(['user', 'outreachSequence', 'stage', 'open',
    'userPodcast', 'podcast', 'emailAccount', 'team', 'counter', 'credit', 'payment']).then(() => {
      if (done) done();
    });
}

const performStageCategoryChangeTest = (category, done) => {
  OutreachSequence.findById(staging.data.outreachSequences[0]._id, (err, outreachSequence) => {
    if (err) {
      expect.fail("An error was thrown while retrieving the sequence", "It should not throw an error", "MongoDB retrieval failed");
      done();
    }
    else {
      expect(outreachSequence).to.exist;
      expect(outreachSequence.currentStage).to.equal(category);

      Stage.findOne({ sequence: staging.data.outreachSequences[0]._id, category: category }, (err, stage) => {
        if (err) {
          expect.fail("An error was thrown while retrieving the stage", "It should not throw an error", "MongoDB retrieval failed");
          done();
        }
        else {
          expect(stage).to.exist;
          done();
        }
      })
    }
  })
}