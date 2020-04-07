const axios = require('axios');
const async = require('async');

const podcastsEvents = require('../constants/podcast-events');
const initialSearch = require('./podcast-search/initial-search');
const afterSearch = require('./podcast-search/after-search');

const LISTEN_NOTES_BASE_URL = "https://listen-api.listennotes.com/api/v2/";

const podcastSearchController = {

  // This search uses the listennotes API
  // https://market.mashape.com/listennotes/listennotes
  performSearch: (params, socket, callback) => {
    // A string containing all of the parameters documented in the listennotes API is formed with the query parameters
    // recieved from the socket
    let queryParams = "type=" + params.type;
    // Keywords must be split to conform to listennotes API specs
    queryParams += params.keywords ? "&q=" + separateKeywords(params.keywords) : "";
    queryParams += params.language ? "&language=" + params.language : "";
    queryParams += params.genreIds ? "&genre_ids=" + params.genreIds.replace(/_/g, ',') : "";
    queryParams += params.offset ? "&offset=" + params.offset : "";
    queryParams += params.publishedAfter ? "&published_after=" + params.publishedAfter : "";
    queryParams += params.publishedBefore ? "&published_before=" + params.publishedBefore : "";
    queryParams += params.sortByDate ? "&sort_by_date=" + params.sortByDate : "";

    podcastSearchController.searchListenNotesAPI(socket, params, queryParams, callback);
  },

  searchListenNotesAPI: (socket, params, queryParams, callback) => {
    axios.get(LISTEN_NOTES_BASE_URL + "search?" + queryParams,
      {
        headers: {
          'X-ListenAPI-Key': process.env.LISTENNOTES_API_KEY
        }
      })
      .then(response => {
        podcastSearchController.processSearchResults(socket, params, response.data, callback);
      })
      .catch(error => {
        callback(error);
      })
  },

  processSearchResults: (socket, params, listenNotesData, callback) => {
    // Sequence of methods required to return first batch of displayable podcasts/episodes to the front-end.
    // These first methods do not persist any information to the DB.
    async.waterfall([
      async.apply(initialSearch.parseListenNotesResults, params.type, listenNotesData.results),
      initialSearch.findInDb,
      initialSearch.addReviewInfo
    ], (err, podcasts) => {
      if (err) callback(err);
      else {
        // An event is emited to the front-end with the first batch of results, total
        // and current offset (used to load different pages/set of results)
        socket.emit(podcastsEvents.RESULTS_FIRST, {
          offset: listenNotesData.next_offset,
          total: listenNotesData.total,
          results: podcasts
        });

        // Counter for keeping track of how many podcast the client has completed
        // processing (look up of iTunes data to avoid server rate-limiting)
        let recieved = 0;

        // Wait for the client's event of lookup of iTunes data for a single podcast search result
        socket.on(podcastsEvents.ITUNES_DATA, ({ index, podcastData, reviewsData }) => {

          let selectedPodcast = podcasts[index];

          podcastSearchController.processAfterSearchResults(selectedPodcast, podcastData, reviewsData, (err) => {
            if (err) {
              //winston.warn(err)
              socket.emit(podcastsEvents.RESULT_ERROR, { iTunesId: selectedPodcast.iTunesId, index });
            }
            else {
              socket.emit(podcastsEvents.RESULT_COMPLETE, { iTunesId: selectedPodcast.iTunesId, index });
            }

            // If all podcasts have been sent by the cient, execute callback to end the process
            if (++recieved >= podcasts.length) {
              callback();
            }
          })
        })
      }
    })
  },

  processAfterSearchResults: (selectedPodcast, podcastData, reviewsData, callback) => {

    // Sequence of methods required to get all the information of a single podcast (reviews, episodes,
    // email, etc) using RSS feeds. The podcast is persisted in the DB at the end of the process
    async.waterfall([
      async.apply(afterSearch.getITunesRSSFeed, selectedPodcast, podcastData),
      afterSearch.lookUpWithRSS,
      async.apply(afterSearch.setReviewInfo, reviewsData),
      afterSearch.persistPodcastsData
    ], (err, podcast) => {
      if (err) {
        //winston.warn(err)
        callback(err);
      }
      else {
        callback(null, podcast);
      }
    });
  }
}

const separateKeywords = keywords => {
  let splitKeywords = keywords.split("_").map(k => {
    let cleanKeyword = k.trim();
    return '"' + cleanKeyword.replace(/['"]+/g, '') + '"';
  });
  return splitKeywords.join(" ");
}

module.exports = podcastSearchController;