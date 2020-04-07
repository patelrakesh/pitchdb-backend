const List = require('../models/list');

const LISTS_PAGE_SIZE = 10;

const listController = {
  getUserLists: (req, callback) => {
    let queryObj = { userId: req.decoded.userId };
    let query;
    if (req.decoded.teamId && req.decoded.role === 'admin') {
      queryObj = { teamId: req.decoded.teamId };
      query = List.find(queryObj).sort('userId').populate('userId');
    }
    else {
      query = List.find(queryObj);
    }
    query.lean().skip(req.query.page ? req.query.page * LISTS_PAGE_SIZE : 0).limit(req.query.page ? LISTS_PAGE_SIZE : 0).exec(callback)
  },

  getUserListsCount: (req, callback) => {
    let queryObj = { userId: req.decoded.userId };
    if (req.decoded.teamId && req.decoded.role === 'admin') {
      queryObj = { teamId: req.decoded.teamId };
    }
    let query = List.countDocuments(queryObj);
    query.exec((err, count) => {
      if (err) callback(err);
      else callback(null, { count: count, pageSize: LISTS_PAGE_SIZE })
    })
  },

  getUserList: (user, id, callback) => {
    let queryObj = { _id: id, userId: user.userId };
    if (user.teamId && user.role === 'admin')
      queryObj = { _id: id, teamId: user.teamId };
    List.findOne(queryObj).lean().exec((err, doc) => {
      if (err)
        callback(err);
      else {
        callback(null, doc);
      }
    })
  },

  createList: (user, listData, callback) => {
    let newList = new List(listData);
    newList.userId = user.userId;
    if (user.teamId) newList.teamId = user.teamId;
    newList.save(callback);
  },

  updateList: (user, id, updateContent, callback) => {
    let queryObj = { _id: id, userId: user.userId };
    if (user.teamId && user.role === 'admin')
      queryObj = { _id: id, teamId: user.teamId };

    List.findOneAndUpdate(queryObj, updateContent, callback);
  },

  deleteList: (user, id, callback) => {
    let queryObj = { _id: id, userId: user.userId };
    if (user.teamId && user.role === 'admin')
      queryObj = { _id: id, teamId: user.teamId };
    List.findOneAndRemove(queryObj, callback);
  },

  createDefaultList: (user, callback) => {
    let newListOb = {
      userId: user._id,
      name: 'Default'
    }

    if (user.teamId) newListOb.teamId = user.teamId;

    let newList = new List(newListOb);
    newList.save(callback);
  },

  updateListOwner: (oldUserId, newUserId, callback) => {
    List.updateMany({ userId: oldUserId }, { userId: newUserId, oldUser: oldUserId }, callback)
  }

};

module.exports = listController;