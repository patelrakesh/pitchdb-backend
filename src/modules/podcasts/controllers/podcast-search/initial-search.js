const async = require('async');

const genresController = require('../genre');
const podcastController = require('../podcast');

const searchCommons = require('./search-commons');

const initialSearch = {
  // Create object to be displayed by the front-end using the data from the listennotes API
  parseListenNotesResults: (type, listenNotesResults, next) => {
    if (type === 'podcast')
      async.map(listenNotesResults, (podcast, callback) => {
        let displayPodcast = {
          title: podcast.title_original,
          feedUrl: podcast.rss,
          description: podcast.description_original,
          image: podcast.image,
          iTunesId: podcast.itunes_id,
          listenNotesId: podcast.id,
          publisherName: podcast.publisher_original,
          type: 'podcast'
        }
        // Get genre's human-readable values and then assign to the object
        genresController.getGenresFromId(podcast.genres, (err, genres) => {
          if (err)
            displayPodcast.genres = []
          else
            displayPodcast.genres = genres;
          callback(null, displayPodcast);
        })
      }, (err, parsedPodcasts) => {
        if (err) next(err);
        else {
          next(null, type, parsedPodcasts);
        }
      });
    else
      async.map(listenNotesResults, (episode, callback) => {
        let displayEpisode = {
          title: episode.title_original,
          description: episode.description_original,
          podcastTitle: episode.podcast_title_original,
          image: episode.image,
          publishDate: episode.pub_date_ms,
          listenNotesId: episode.id,
          iTunesId: episode.itunes_id,
          podcastListenNotesId: episode.podcast_id,
          publisherName: episode.publisher_original,
          feedUrl: episode.rss,
          type: 'episode',
          duration: episode.audio_length,
          audio: episode.audio
        }
        // Get genre's human-readable values and then create the object
        genresController.getGenresFromId(episode.genres, (err, genres) => {
          if (err)
            displayEpisode.genres = [];
          else
            displayEpisode.genres = genres;
          callback(null, displayEpisode);
        })
      }, (err, parsedEpisodes) => {
        if (err) next(err);
        else {
          next(null, type, parsedEpisodes);
        }
      });
  },

  findInDb: (type, podcasts, next) => {
    // Only search for podcasts, episodes as they come from Listen notes are not saved in the database yet
    if (type === 'podcast')
      async.map(podcasts, (podcast, callback) => {
        podcastController.getById(podcast.id, false, true, (err, fetchedPodcast) => {
          if (err || !fetchedPodcast) {
            callback(null, podcast);
          }
          else callback(null, fetchedPodcast);
        })
      }, (err, fetchedPodcasts) => {
        if (err) {
          //winston.warn(err);
          next(null, type, podcasts)
        }
        else next(null, type, fetchedPodcasts);
      })
    else {
      next(null, type, podcasts);
    }
  },

  addReviewInfo: (type, podcasts, next) => {
    // Attemp obtaining the podcast reviews data
    if (type === 'podcast') {
      async.map(podcasts, (podcast, callback) => {
        if (!podcast._id || podcast.needsUpdate) {
          searchCommons.addReviewScores(podcast, callback);
        }
        else {
          callback(null, podcast);
        }
      }, (err, podcastsWithReviews) => {
        if (err) next(null, podcasts);
        else next(null, podcastsWithReviews);
      })
    }
    else {
      next(null, podcasts);
    }
  },
}

module.exports = initialSearch;