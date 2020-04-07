const Podcast = require('../models/podcast');
const PodcastEpisode = require('../models/podcast-episode');
const PodcastReview = require('../models/podcast-review');
const mongoose = require('mongoose');

const EPISODES_PAGE_SIZE = 15;
const REVIEWS_PAGE_SIZE = 10;

const podcastController = {
  getById: (id, withEpisodes, onlyListenNotes, callback) => {
    Podcast.findOne({ listenNotesId: id }, (err, docs) => {
      if (err) callback(err);
      else {
        if (!docs && !onlyListenNotes) {
          Podcast.findById(id, (err, doc) => {
            if (err) callback(err);
            else {
              if (withEpisodes) getEpisodesInfo(doc, callback);
              else
                callback(null, doc);
            }
          })
        }
        else
          if (withEpisodes && !onlyListenNotes) getEpisodesInfo(docs, callback);
          else
            callback(null, docs);

      }
    })
  },

  pesistPodcast: (podcastData, callback) => {
    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    };
    podcastData.needsUpdate = false;
    Podcast.findOneAndUpdate({ _id: podcastData._id || mongoose.Types.ObjectId() }, podcastData, options, callback);
  },

  persistManyPodcasts: (podcastDataArray, callback) => {
    Podcast.insertMany(podcastDataArray, { ordered: false }, (err, docs) => {
      if (err) callback(err);
      else callback(null, docs);
    });
  },

  getEpisodes: (req, callback) => {
    PodcastEpisode.find({ podcast: req.params.id }).limit(EPISODES_PAGE_SIZE).sort('-publishDate').skip(req.query.page ? req.query.page * EPISODES_PAGE_SIZE : 0).exec(callback);
  },

  getEpisodesCount: (req, callback) => {
    PodcastEpisode.countDocuments({ podcast: req.params.id }).exec((err, count) => {
      if (err) callback(err)
      else callback(null, { count: count, pageSize: EPISODES_PAGE_SIZE })
    });
  },

  getReviews: (req, callback) => {
    PodcastReview.find({ podcastId: req.params.id }).limit(REVIEWS_PAGE_SIZE).sort('-date').skip(req.query.page ? req.query.page * REVIEWS_PAGE_SIZE : 0).exec(callback);
  },

  getReviewsCount: (req, callback) => {
    PodcastReview.countDocuments({ podcastId: req.params.id }).exec((err, count) => {
      if (err) callback(err)
      else callback(null, { count: count, pageSize: REVIEWS_PAGE_SIZE })
    });
  }
};

const getEpisodesInfo = (doc, callback) => {
  PodcastEpisode.find({ podcast: doc._id }).sort('-publishDate').exec((err, docs) => {
    if (err) callback(err);
    else {
      let objPodcast = doc.toObject();
      objPodcast.episodes = docs;
      callback(null, objPodcast);
    }
  })
}

module.exports = podcastController;