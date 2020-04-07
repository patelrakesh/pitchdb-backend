const async = require('async');

const ListItem = require('../models/list-item');
const UserPodcast = require('../models/user-podcast');
const UserPodcastEpisode = require('../models/user-podcast-episode');
const UserEventOrganization = require('../models/user-event-organization');
const UserBusiness = require('../models/user-business');
const UserGuest = require('../models/user-guest');
const UserMediaOutlet = require('../models/user-media-outlet');
const UserConference = require('../models/user-conference');
const OutreachSequence = require('../../outreach/models/outreach-sequence');

const listItemContact = require('./list-item-contact');

const userItemController = require('./user-item');
const outreachSequenceController = require('../../outreach/controllers/outreach-sequence');
const emailAccountController = require('../../users/controllers/email-account');
const creditController = require('../../credits/controllers/credit');
const counterController = require('../../credits/controllers/counter');
const CustomError = require('../../common/errors/custom-error');
const errorConstants = require('../../common/errors/constants');

const LISTS_ITEMS_PAGE_SIZE = 10;

const listItemController = {
  create: (req, callback) => {
    let type = req.query.type;

    let user = req.decoded;

    let items = req.body;
    let itemObjects = [];

    items.forEach(item => {
      item.userId = user.userId;
      if (user.teamId)
        item.teamId = user.teamId;

      delete item.selected;

      let itemObject = {
        object: item,
        objectKey: type
      };
      setUserItemAddParameters(type, itemObject);

      itemObjects.push(itemObject);
    });

    async.map(itemObjects, userItemController.findOrCreateItem, (err, itemObjects) => {

      if (err) {
        callback(err);
      }
      else {
        const listId = req.params.id;
        let itemObjectsWithListId = itemObjects.map(itemObject => {
          let listItem = {
            listId
          }
          setListItemObjId(type, listItem, itemObject._id);
          return listItem;
        })
        ListItem.insertMany(itemObjectsWithListId, { ordered: false }, () => callback());
      }
    });
  },

  countSummary: (req, callback) => {
    let listId = req.params.id;
    async.parallel([
      callback => listItemController.countItems(listId, 'podcast', callback),
      callback => listItemController.countItems(listId, 'episode', callback),
      callback => listItemController.countItems(listId, 'eventOrganization', callback),
      callback => listItemController.countItems(listId, 'business', callback),
      callback => listItemController.countItems(listId, 'mediaOutlet', callback),
      callback => listItemController.countItems(listId, 'conference', callback),
      callback => listItemController.countItems(listId, 'guest', callback),
    ], (err, counts) => {
      if (err) callback(err);
      else {
        callback(null, {
          podcast: counts[0],
          episode: counts[1],
          eventOrganization: counts[2],
          business: counts[3],
          mediaOutlet: counts[4],
          conference: counts[5],
          guest: counts[6],
        })
      }
    })
  },

  get: (req, callback) => {
    let listId = req.params.id;
    let type = req.query.type;
    let queryObj = { listId };
    setListItemQuery(queryObj, type);
    ListItem.find(queryObj).populate(getFieldByType(type)).sort('-date')
      .limit(LISTS_ITEMS_PAGE_SIZE).skip(req.query.page ? req.query.page * LISTS_ITEMS_PAGE_SIZE : 0).exec(callback);
  },

  count: (req, callback) => {
    listItemController.countItems(req.params.id, req.query.type, (err, count) => {
      if (err) callback(err);
      else callback(null, {
        count,
        pageSize: LISTS_ITEMS_PAGE_SIZE
      })
    })
  },

  countItems: (listId, type, callback) => {
    let queryObj = { listId };
    setListItemQuery(queryObj, type);
    ListItem.countDocuments(queryObj).exec(callback);
  },

  delete: (req, callback) => {
    let listId = req.params.id;
    let queryObj = { listId };
    let itemsIds = req.body;
    queryObj._id = { $in: itemsIds };
    ListItem.deleteMany(queryObj).exec((err) => {
      if (err) callback(err);
      else {
        callback()
        //TODO: Check and remove userItem if not present in any outreach sequences nor lists
      }
    })
  },

  connectContacts: (req, callback) => {

    counterController.get(req.decoded.userId, req.decoded.teamId, (err, counter) => {
      if (err) return callback(err);
      if (counter && counter.remaining > 0) {
        let itemsList = req.body;
        const user = req.decoded;

        emailAccountController.getActiveEmailAccount(req.decoded.userId, (err, emailAccount) => {
          if (err) {
            return callback(err);
          }
          if (!emailAccount) {
            return callback(new CustomError("No email connected for sending messages, please configure one in your account's configuration.", 460));
          }

          itemsList.forEach(item => {
            item.userId = user.userId;
            if (user.teamId)
              item.teamId = user.teamId;

            item.emailFrom = emailAccount.email;
            item.emailAccountId = emailAccount._id;
          });

          async.map(itemsList, listItemController.connectContact, (err, results) => {
            if (err) return callback(err);

            const resultsCount = results.filter((res) => res).length;
            callback(null, { resultsCount });
          })
        })
      }
      else
        callback(new CustomError("You don't have any credits left", errorConstants.STATUS_PAYMENT_REQUIRED));
    })
  },

  connectContact: (item, callback) => {
    listItemContact.addContactData(item, (err, email) => {
      if (err) return callback(err);

      if (!email)
        return callback();

      item.emailTo = email;

      outreachSequenceController.createOutreachSequence(item, (err, sequence) => {
        if (err) return callback(err);

        creditController.useCredit(item.userId, item.teamId, sequence._id, (err) => {
          if (err) return callback(err);

          callback(null, true);
        })
      })
    })
  },

  getSequence: (req, callback) => {
    OutreachSequence.findOne({ userId: req.decoded.userId, listItemId: req.params.listItemId }, callback);
  },

  setActiveSequence: (req, callback) => {
    OutreachSequence.findOneAndUpdate({ userId: req.decoded.userId, listItemId: req.params.listItemId }, { active: true }, { upsert: true }, callback);
  },

  updateAllUserItemsOwner: (oldUserId, newUserId, callback) => {
    async.series([
      callback => updateUserBusinessOwner(oldUserId, newUserId, callback),
      callback => updateUserConferenceOwner(oldUserId, newUserId, callback),
      callback => updateUserEvenOrgOwner(oldUserId, newUserId, callback),
      callback => updateUserGuestOwner(oldUserId, newUserId, callback),
      callback => updateUserMediaOutletOwner(oldUserId, newUserId, callback),
      callback => updateUserPodcastOwner(oldUserId, newUserId, callback),
      callback => updateUserEpisodeOwner(oldUserId, newUserId, callback)
    ], callback)
  }
};

const setUserItemAddParameters = (type, itemObject) => {
  switch (type) {
    case 'podcast':
      itemObject.model = UserPodcast;
      itemObject.itemIdKey = 'listenNotesId';
      itemObject.idKey = 'listenNotesId';
      break;
    case 'episode':
      itemObject.model = UserPodcastEpisode;
      itemObject.itemIdKey = 'listenNotesId';
      itemObject.idKey = 'listenNotesId';
      break;
    case 'eventOrganization':
      itemObject.model = UserEventOrganization;
      itemObject.itemIdKey = 'eventOrganizationId';
      itemObject.idKey = '_id';
      break;
    case 'business':
      itemObject.model = UserBusiness;
      itemObject.itemIdKey = 'businessId';
      itemObject.idKey = '_id';
      break;
    case 'mediaOutlet':
      itemObject.model = UserMediaOutlet;
      itemObject.itemIdKey = 'mediaOutletId';
      itemObject.idKey = '_id';
      break;
    case 'conference':
      itemObject.model = UserConference;
      itemObject.itemIdKey = 'conferenceId';
      itemObject.idKey = '_id';
      break;
    case 'guest':
      itemObject.model = UserGuest;
      itemObject.itemIdKey = 'guestId';
      itemObject.idKey = '_id';
      break;
    default:
      break;
  }
}

const setListItemObjId = (type, listItem, userItemId) => {
  switch (type) {
    case 'podcast':
      listItem.userPodcast = userItemId;
      break;
    case 'episode':
      listItem.userPodcastEpisode = userItemId;
      break;
    case 'eventOrganization':
      listItem.userEventOrganization = userItemId;
      break;
    case 'business':
      listItem.userBusiness = userItemId;
      break;
    case 'mediaOutlet':
      listItem.userMediaOutlet = userItemId;
      break;
    case 'conference':
      listItem.userConference = userItemId;
      break;
    case 'guest':
      listItem.userGuest = userItemId;
      break;
    default:
      break;
  }
}

const setListItemQuery = (queryObj, type) => {
  const existsExpression = { $exists: true };
  switch (type) {
    case 'podcast':
      queryObj.userPodcast = existsExpression;
      break;
    case 'episode':
      queryObj.userPodcastEpisode = existsExpression;
      break;
    case 'eventOrganization':
      queryObj.userEventOrganization = existsExpression;
      break;
    case 'business':
      queryObj.userBusiness = existsExpression;
      break;
    case 'mediaOutlet':
      queryObj.userMediaOutlet = existsExpression;
      break;
    case 'conference':
      queryObj.userConference = existsExpression;
      break;
    case 'guest':
      queryObj.userGuest = existsExpression;
      break;
    default:
      break;
  }
}

const getFieldByType = type => {
  switch (type) {
    case 'podcast':
      return 'userPodcast';
    case 'episode':
      return 'userPodcastEpisode';
    case 'eventOrganization':
      return 'userEventOrganization';
    case 'business':
      return 'userBusiness';
    case 'mediaOutlet':
      return 'userMediaOutlet';
    case 'conference':
      return 'userConference';
    case 'guest':
      return 'userGuest';
    default:
      break;
  }
}

const updateUserBusinessOwner = (oldUserId, newUserId, callback) => {
  UserBusiness.updateMany({ userId: oldUserId }, { userId: newUserId, oldUser: oldUserId }, callback)
}

const updateUserConferenceOwner = (oldUserId, newUserId, callback) => {
  UserConference.updateMany({ userId: oldUserId }, { userId: newUserId, oldUser: oldUserId }, callback)
}

const updateUserEvenOrgOwner = (oldUserId, newUserId, callback) => {
  UserEventOrganization.updateMany({ userId: oldUserId }, { userId: newUserId, oldUser: oldUserId }, callback)
}

const updateUserGuestOwner = (oldUserId, newUserId, callback) => {
  UserGuest.updateMany({ userId: oldUserId }, { userId: newUserId, oldUser: oldUserId }, callback)
}

const updateUserMediaOutletOwner = (oldUserId, newUserId, callback) => {
  UserMediaOutlet.updateMany({ userId: oldUserId }, { userId: newUserId, oldUser: oldUserId }, callback)
}

const updateUserPodcastOwner = (oldUserId, newUserId, callback) => {
  UserPodcast.updateMany({ userId: oldUserId }, { userId: newUserId, oldUser: oldUserId }, callback)
}

const updateUserEpisodeOwner = (oldUserId, newUserId, callback) => {
  UserPodcastEpisode.updateMany({ userId: oldUserId }, { userId: newUserId, oldUser: oldUserId }, callback)
}

module.exports = listItemController;