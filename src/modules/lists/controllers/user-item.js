const UserPodcast = require('../models/user-podcast');
const UserPodcastEpisode = require('../models/user-podcast-episode');

const Podcast = require('../../podcasts/models/podcast');

const userItemController = {
  findOrCreateItem: ({ model, object, objectKey, itemIdKey, idKey }, callback) => {

    userItemController.findUserItemById(model, object, itemIdKey, idKey, (err, result) => {
      if (err) callback(err)
      else {
        if (result) callback(null, result);
        else {
          let userItem = {
            userId: object.userId,
            [objectKey]: object,
            [itemIdKey]: object[idKey],
          }
          if (object.teamId) userItem.teamId = object.teamId;
          userItemController.createUserItem(model, userItem, callback);
        }
      }
    })
  },

  findUserItemById: (model, object, itemIdKey, idKey, callback) => {
    let queryObj = { userId: object.userId, [itemIdKey]: object[idKey] };
    if (object.teamId) queryObj = { teamId: object.teamId, [itemIdKey]: object[idKey] };
    model.findOne(queryObj).lean().exec(callback)
  },

  findById: (model, id, callback) => {
    model.findById(id, callback);
  },

  createUserItem: (model, userItem, callback) => {
    // Temporal check for podcasts and podcastsepisodes
    if (model === UserPodcast || model === UserPodcastEpisode) {
      Podcast.findOne({ listenNotesId: model === UserPodcast ? userItem.listenNotesId : userItem.episode.podcastListenNotesId }, (err, podcast) => {
        if (podcast && podcast.email)
          if (model === UserPodcast) userItem.podcast.hasEmail = true;
          else userItem.episode.hasEmail = true;
        let newUserItem = new model(userItem);
        newUserItem.save(callback);
      })
    }
    else {
      let newUserItem = new model(userItem);
      newUserItem.save(callback);
    }
  }
};

module.exports = userItemController;