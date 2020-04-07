const Podcast = require('../models/podcast');
const ListItem = require('../../lists/models/list-item');
const UserPodcast = require('../../lists/models/user-podcast');
const CustomError = require('../../common/errors/custom-error');

const podcastSearchController = require('../controllers/podcast-search');

const podstationListennotesId = 'PODSTATION';

const postationController = {

  persistPodcasts: (req, callback) => {
    let podcastArray = req.body.map(podcast => {
      return {
        ...podcast,
        listenNotesId: `${podstationListennotesId}-${podcast.feedUrl}`,
        needsUpdate: true
      }
    })
    Podcast.insertMany(podcastArray, { ordered: false }, (err, docs) => {
      if (err) {
        if (err.code === 11000) callback();
        else {
          callback(err)
        }
      }
      else callback(null, docs);
    });
  },

  addPodcastToList: (req, callback) => {
    const list = req.body.list;
    const podcast = req.body.podcast;

    Podcast.findOne({
      feedUrl: podcast.feedUrl ? podcast.feedUrl : podcast.url
    }, (err, foundPodcast) => {
      if (err) callback(err)
      else {
        if (foundPodcast) {
          if (foundPodcast.needsUpdate) {
            podcastSearchController.processAfterSearchResults(foundPodcast, { feedUrl: foundPodcast.feedUrl }, null, (err, processedPodcast) => {
              if (err) callback(err);
              else
                addPodcastToList(req.decoded, processedPodcast, list, callback);
            })
          }
          else {
            addPodcastToList(req.decoded, foundPodcast, list, callback);
          }
        }
        else {
          callback(new CustomError('Podcast not found', 404));
        }
      }
    })
  }
}

const addPodcastToList = (user, podcast, list, callback) => {
  findOrCreateUserPodcast(user, podcast, (err, userPodcast) => {
    if (err) callback(err);
    else {
      let listItem = new ListItem({
        listId: list._id,
        userPodcast: userPodcast._id
      });
      listItem.save(callback);
    }
  });
}

const findOrCreateUserPodcast = (user, podcast, callback) => {
  let queryObj = { userId: user.userId, 'podcast.feedUrl': podcast.feedUrl };
  if (user.teamId) queryObj = { teamId: user.teamId, 'podcast.feedUrl': podcast.feedUrl };
  UserPodcast.findOne(queryObj, (err, userPodcast) => {
    if (err) callback(err)
    else {
      if (userPodcast) {
        callback(null, userPodcast);
      }
      else {
        let newUserPodcast = new UserPodcast({
          userId: user.userId,
          teamId: user.teamId,
          listenNotesId: podcast.listenNotesId,
          podcast
        });

        newUserPodcast.save(callback);
      }
    }
  })
}

module.exports = postationController