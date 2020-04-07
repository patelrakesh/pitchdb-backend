const async = require('async');
const axios = require('axios');
const podcastController = require('../podcast');
const podcastEpisodeController = require('../podcast-episode');

const PodcastReview = require('../../models/podcast-review');
const Podcast = require('../../models/podcast');

let Parser = require('rss-parser');
let parser = new Parser();
const searchCommons = require('./search-commons');

const ITUNES_BASE_URL = "https://itunes.apple.com/";

const afterSearch = {

  // If iTunes feed url was sent from the front-end, assign it to the podcast obj else
  // use the iTunes API to get it
  // Listnenotes feed urls are not used to prevent rate-limiting since they all go through their domain
  getITunesRSSFeed: (podcast, itunesData, next) => {
    if ((!podcast._id || podcast.needsUpdate) && itunesData) {
      podcast.feedUrl = itunesData.feedUrl;
      next(null, podcast);
    }
    else {
      axios.get(ITUNES_BASE_URL + "/lookup?id=" + podcast.iTunesId)
        .then(response => {
          const elements = response.data.results;
          if (elements[0]) {
            podcast.feedUrl = elements[0].feedUrl;
          }
          next(null, podcast);
        })
        .catch(() => {
          next(null, podcast);
        })
    }
  },

  // Get additional data from the RSS feed, mainly the contact email and episodes data
  lookUpWithRSS: (podcast, next) => {
    // Only perform the lookup if the podcast was not found in the database
    if (!podcast._id || podcast.needsUpdate) {
      const query = { listenNotesId: podcast.type === 'podcast' ? podcast.listenNotesId : podcast.podcastListenNotesId }
      Podcast.findOne(query).lean().exec((err, searchedPodcast) => {
        if ((err || !searchedPodcast) || searchedPodcast.needsUpdate) {
          let podcastToUse =
            (searchedPodcast && searchedPodcast.needsUpdate) ? Object.assign(searchedPodcast, podcast) : podcast;
          searchParseRSS(podcastToUse.feedUrl, (err, parsedData) => {
            if (err) {
              //winston.warn(err);
              next(null, podcastToUse);
            }
            else {
              let podcastRssData = {
                title: parsedData.title,
                description: parsedData.description,
                feedUrl: parsedData.feedUrl ? parsedData.feedUrl : podcastToUse.feedUrl,
                link: parsedData.link,
                generator: parsedData.generator,
                language: parsedData.language,
                copyright: parsedData.copyright,
                publishDate: parsedData.pubDate,
                docs: parsedData.docs,
              };
              if (parsedData.itunes) {
                if (parsedData.itunes.owner) {
                  podcastRssData.email = parsedData.itunes.owner.email;
                  podcastRssData.owner = parsedData.itunes.owner.name;
                }
                if (!podcastToUse.publisherName) podcastRssData.publisherName = parsedData.itunes.author
              }
              if (parsedData.image) {
                podcastRssData.image = parsedData.image.url ? parsedData.image.url : podcastToUse.image;
              }

              let podcastToPersist = Object.assign(podcastToUse, podcastRssData);
              // Asign the listennotesId for future referencing depending on search type
              podcastToPersist.listenNotesId = podcastToUse.type === 'podcast' ? podcastToUse.listenNotesId : podcastToUse.podcastListenNotesId;
              podcastToPersist.episodesArray = afterSearch.addEpisodeInfo(parsedData, podcastToPersist);

              next(null, podcastToPersist);
            }
          })
        }
        else {
          next(null, searchedPodcast);
        }
      })
    }
    else {
      next(null, podcast);
    }
  },

  addEpisodeInfo: (rssData, podcast) => {
    let episodesToPersist = [];
    for (let i = rssData.items.length - 1; i >= 0; i--) {
      const episode = rssData.items[i];
      let podcastEpisode = {
        title: episode.title,
        feedUrl: podcast.feedUrl,
        description: episode.contentSnippet,
        publishDate: episode.pubDate,
        link: episode.link,
        enclosure: episode.enclosure
      };
      if (episode.itunes) {
        if (episode.itunes.keywords) podcastEpisode.keywords = typeof episode.itunes.keywords === "string" ? episode.itunes.keywords.split(",") : [];
        podcastEpisode.duration = episode.itunes.duration;
        podcastEpisode.description = episode.itunes.summary;
      }
      episodesToPersist.push(podcastEpisode);
    }
    return episodesToPersist;
  },

  setReviewInfo: (reviewsData, podcast, next) => {
    if ((!podcast._id && !podcast.rating) || podcast.needsUpdate) {
      searchCommons.calcReviewScores(podcast, reviewsData, () => {
        next(null, podcast);
      });
    }
    else {
      next(null, podcast);
    }
  },

  persistPodcastsData: (podcast, next) => {
    if (!podcast._id || podcast.needsUpdate) {
      podcastController.pesistPodcast(podcast, (err, persistedPodcast) => {
        if (err) {
          // Podcast already exists, no error raised
          if (err.code === 11000) next(null, podcast);
          else {
            //winston.warn(err);
            next(err, podcast)
          }
        }
        else {
          // Set the podcast reference to all the episodes and reviews, then persist
          let reviews = podcast.reviewsArray || [];
          reviews.forEach(review => {
            review.podcastId = persistedPodcast._id;
          });

          let episodes = podcast.episodesArray || [];
          episodes.forEach(episode => {
            episode.podcast = persistedPodcast._id;
          });

          async.parallel([
            callback => {
              PodcastReview.insertMany(reviews, () => {
                callback();
                //if (err) { winston.warn(err) }
              });
            },
            callback => {
              podcastEpisodeController.persistManyPodcastEpisodes(episodes, () => {
                callback();
                //if (err) { winston.warn(err) }
              })
            }
          ],
            // Finish podcast persist process
            err => {
              if (err) {
                next(err, podcast)
              }
              else
                next(null, persistedPodcast);
            });
        }
      })
    }
    else {
      next(null, podcast);
    }
  },
}

const searchParseRSS = (rss, callback) => {
  if (rss)
    parser.parseURL(rss, (err, result) => {
      if (err) {
        callback(err);
      }
      else {
        callback(null, result);
      }
    })
  else callback("Null rss")
}

module.exports = afterSearch;