const Team = require('../models/team');
const User = require('../models/user');
const Counter = require('../../credits/models/counter');
const Credit = require('../../credits/models/credit');
const List = require('../../lists/models/list');
const EmailAccount = require('../models/email-account');
const userController = require('./user');
const authController = require('./authentication');
const listController = require('../../lists/controllers/list')
const listItemController = require('../../lists/controllers/list-item')

const errorConstants = require('../../common/errors/constants');
const CustomError = require('../../common/errors/custom-error');

const async = require('async');

const teamController = {
  create: (req, callback) => {
    const team = req.body;
    const userId = req.decoded.userId;
    let newTeam = new Team(team);
    newTeam.save((err, teamDoc) => {
      if (err) callback(err)
      else
        async.parallel(
          [
            next => {
              Counter.findOneAndUpdate({ userId: userId }, { teamId: teamDoc._id }, next);
            },
            next => {
              Credit.findOneAndUpdate({ userId: userId }, { teamId: teamDoc._id }, next);
            },
            next => {
              List.findOneAndUpdate({ userId: userId }, { teamId: teamDoc._id }, next);
            }
          ],
          (err) => {

            if (err || !teamDoc)
              callback(err ? err : new CustomError("Not found", 500));
            else {
              let updatedUser = {
                teamId: teamDoc._id,
                role: 'admin',
                _id: req.decoded.userId
              }
              userController.update(updatedUser, (err, data) => {
                if (err) callback(err)
                else {
                  let jwt = authController.generateJWT(data);
                  callback(null, { user: data, token: jwt });
                }
              })
            }
          }
        )
    })
  },

  getTeamAndUsers: (teamId, callback) => {
    Team.findById(teamId).lean().exec((err, team) => {
      if (err || !team) callback(err);
      else
        User.find({ teamId: teamId }).lean().exec((err, users) => {
          if (err) callback(err);
          else {
            team.users = [];
            users.forEach(user => {
              team.users.push(user);
            });
            callback(null, team);
          }
        })
    })
  },

  removeTeamUser: (user, userId, callback) => {
    if (user.role !== 'admin')
      callback(new CustomError("Not an admin", errorConstants.STATUS_FORBIDDEN));
    else {
      // Possible extend behaivour
      async.parallel(
        [
          next => {
            User.findByIdAndRemove(userId, next);
          },
          next => {
            EmailAccount.findOneAndRemove({ userId: userId }, next);
          },
          next => {
            listController.updateListOwner(userId, user.userId, next)
          },
          next => {
            listItemController.updateAllUserItemsOwner(userId, user.userId, next)
          }
        ],
        callback
      )
    }
  }
};

module.exports = teamController;