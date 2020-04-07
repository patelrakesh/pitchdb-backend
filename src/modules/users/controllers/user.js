/* eslint-disable linebreak-style */
const User = require('../models/user');
const Credential = require('../models/credential');

const CustomError = require('../../common/errors/custom-error');

const authController = require('./authentication');
const userCredentialsController = require('./user-credential');
const listController = require('../../lists/controllers/list');
const counterController = require('../../credits/controllers/counter');

const networkConstants = require('../../users/constants/networks');

const bcrypt = require('bcrypt');

const userController = {
  update: (updateData, callback) => {
    User.findByIdAndUpdate(updateData._id, updateData, { new: true }, callback);
  },

  login: (loginInfo, callback) => {
    User.findOne({ email: loginInfo.email }, (err, user) => {
      if (err || !user) callback(err || new CustomError("No account found with that email and/or password", 401))
      else {
        compareUserPasswords(user._id, loginInfo.password, true, (err) => {
          authController.saveLoginData(user && user._id, err);
          if (err) callback(err);
          else if (user.disabled) callback(new CustomError("User is disabled"), 418);
          else{
            const token = authController.generateJWT(user);

            if(user.addedPrivileges && user.addedPrivileges.length > 0 ){
              //Do something
              console.log("New privileges");
              
            }
           
            User.findOneAndUpdate({ _id: user._id}, { jwtToken: token, addedPrivileges: []}, err => {
              if (err) callback(err);
            })
            callback(null, token)
          }
        })
      }
    })
  },

  createFromWebHook: (whData, callback) => {
    console.log(whData)
    let userData = {
      ...parsePaperformResponse(whData),
      paperform: true
    }
    userData.signupEmail = userData.email;
    let newUser = new User(userData);

    newUser.save((err, user) => {
      if (err) callback(err);
      else {
        listController.createDefaultList(user, (err) => {
          if (err) callback(err)
          else {
            counterController.createCounter(user._id, null, (err) => {
              if (err) callback(err);
              else {
                userCredentialsController.sendUserPassword(user, true, (err) => {
                  if (err) callback(err);
                  else callback(null, user);
                });
              }
            })
          }
        });
      }
    })
  },

  updateSignInMethod: (req, callback) => {
    let CALLBACK_URL = process.env.FRONT_BASE_URL + "/authcallback";

    let params;
    let method;

    switch (req.params.network) {
      case networkConstants.LINKEDIN:
        params = {
          grant_type: 'authorization_code',
          code: req.body.code,
          redirect_uri: CALLBACK_URL,
          client_id: process.env.LINKEDIN_ID,
          client_secret: process.env.LINKEDIN_SECRET
        }
        method = authController.linkedinLogin;
        break;

      case networkConstants.FACEBOOK:
        params = "code=" + req.body.code;
        params += "&redirect_uri=" + CALLBACK_URL;
        params += "&client_id=" + process.env.FACEBOOK_ID;
        params += "&client_secret=" + process.env.FACEBOOK_SECRET;
        method = authController.facebookLogin;
        break;

      case networkConstants.GOOGLE:
        params = {
          grant_type: 'authorization_code',
          code: req.body.code,
          redirect_uri: CALLBACK_URL,
          client_id: process.env.GOOGLE_ID,
          client_secret: process.env.GOOGLE_SECRET
        }
        method = authController.googleLogin
        break;

      case networkConstants.MICROSOFT:
        params = {
          client_id: process.env.MICROSOFT_ID,
          client_secret: process.env.MICROSOFT_PASSWORD,
          code: req.body.code,
          redirect_uri: CALLBACK_URL,
          grant_type: 'authorization_code'
        };
        method = authController.microsoftLogin
        break;

      default:
        callback("Invalid network");
        break;
    }
    method(params, 'true', null, req.decoded.userId, callback);
  },

  changePassword: (req, callback) => {
    let { password, newPassword } = req.body;
    compareUserPasswords(req.decoded.userId, password, false, (err) => {
      if (err) callback(new CustomError('Your old password is incorrect', 422))
      else {
        const saltRounds = 10;
        bcrypt.hash(newPassword, saltRounds, (err, hash) => {
          if (err) callback(err)
          else {
            Credential.findOneAndUpdate({ userId: req.decoded.userId }, { password: hash }, err => {
              if (err) callback(err);
              else
                callback();
            })
          }
        })
      }
    })
  },

  resetPassword: (req, callback) => {
    User.findOne({ email: req.body.email, network: null }, (err, user) => {
      if (err || !user) callback();
      else {
        userCredentialsController.sendUserPassword(user, false, callback);
      }
    })
  }

};

const parsePaperformResponse = paperformData => {
  /*
          {
              "data": [
                      {
                          "title": "question 1", //Title of question as defined
                          "description": "This is the second question", 
                          "type": "address", //Question type
                          "key": "ba7ri", //Question pre-fill key (unique to form).
                          "value": "343 Tester Road, Snohomish, Washington, 98290, United States" //Submitted value for question
                          "custom_key": "address_1" //Custom pre-fill key (if set).
                      },
                      {
                          "title": "question 2",
                          "description": "This is the second question",
                          "type": "text",
                          "key": "tgp8",
                          "value": "Test 123",
                          "custom_key": ""
                      }
                  //... each question has its own object.
                  ],
                  "submission_id": "XXXXXXXXXXXXXXXXXXX", //Unique ID for submission.
                  "created_at": "2017-06-09 09:51:23", //Submission date
                  "ip_address": "192.168.10.1", //IP Address of submission
                  "charge": null //if a payment is made, payment information is given here.
              }
          */
  let paperformDataObj = paperformData.data;
  let userObj = { detail: {} };

  paperformDataObj.forEach(question => {
    if (typeof question.value === 'string')
      question.value = question.value.trim();
    userObj.detail[question.custom_key] = question.value
  });

  userObj.submissionId = paperformData.submission_id;
  userObj.email = userObj.detail.email;
  userObj.name = userObj.detail.firstName + " " + userObj.detail.lastName;

  return userObj;
}

const compareUserPasswords = (userId, password, updateAttempt, callback) => {
  Credential.findOne({ userId }, (err, credential) => {
    if (err || !credential) callback(err || new CustomError("No account found with that email and/or password", 401));
    else {
      bcrypt.compare(password, credential.password, (err, res) => {
        if (err || !res) callback(err || new CustomError("No account found with that email and/or password", 401))
        else callback();
      });
    }
  })
}

module.exports = userController;