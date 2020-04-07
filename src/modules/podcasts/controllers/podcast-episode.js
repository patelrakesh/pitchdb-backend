const PodcastEpisode = require('../models/podcast-episode');
const async = require('async');

const podcastEpisodeController = {
  getById: (id, callback) => {
    PodcastEpisode.findOne({ $or: [{ _id: id }, { listenNotesId: id }] }, (err, doc) => {
      if (err) callback(err);
      else {
        callback(null, doc);
      }
    })
  },

  pesistPodcastEpisode: (podcastEpisodeData, callback) => {
    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    };
    PodcastEpisode.findOneAndUpdate({ podcast: podcastEpisodeData.podcast, title: podcastEpisodeData.title }, podcastEpisodeData, options, (err) => {
      if (err) console.log(err);
      callback();
    });
  },

  persistManyPodcastEpisodes: (podcastDataArray, callback) => {
    async.mapLimit(podcastDataArray, 3, podcastEpisodeController.pesistPodcastEpisode, callback);
  }
};

module.exports = podcastEpisodeController;