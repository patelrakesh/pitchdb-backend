let FeedParser = require('feedparser');
let request = require('request');
const ITUNES_RATING_URL = "https://itunes.apple.com/us/rss/customerreviews/id=";

const searchCommons = {
  addReviewScores: (podcast, callback) => {
    // Not all podcasts have a feed at this URL. I don't know which are the conditions for one to have it
    getFeed(ITUNES_RATING_URL + podcast.iTunesId + "/xml", (err, result) => {
      if (err) callback(null, podcast);
      else {
        searchCommons.calcReviewScores(podcast, result, callback);
      }
    })
  },

  calcReviewScores: (podcast, reviewsData, callback) => {
    let totalSumReview = 0;
    let reviewsArray = [];
    if (reviewsData && reviewsData.length > 1) {
      for (let i = 1; i < reviewsData.length; i++) {
        const review = reviewsData[i];
        let reviewRating = Number(review['im:rating']['#']);
        reviewsArray.push({
          rating: reviewRating,
          date: review.pubDate,
          title: review.title,
          comment: review.description,
          author: review.author
        });
        totalSumReview += reviewRating;
      }
    }

    // Set default values for podcasts with no reviews
    if (reviewsArray.length <= 0) {
      podcast.rating = -1;
      podcast.ratingsAmount = 0;
    }
    else {
      podcast.rating = totalSumReview / reviewsArray.length;
      podcast.ratingsAmount = reviewsArray.length;
    }
    podcast.reviewsArray = reviewsArray;
    callback(null, podcast);
  }
}

const getFeed = (urlfeed, callback) => {
  // Set a timeout of 6 seconds to prevent a search operation from taking too long
  let req = request(urlfeed, { timeout: 6000 });
  let feedparser = new FeedParser();
  let feedItems = new Array();
  req.on("response", response => {
    let stream = req;
    if (response.statusCode == 200) {
      stream.pipe(feedparser);
    }
  });
  req.on("error", err => {
    //winston.warn(err);
    callback(err);
  });
  feedparser.on("readable", () => {
    try {
      let item = feedparser.read();
      if (item !== null) {
        feedItems.push(item);
      }
    }
    catch (err) {
      //winston.warn(err);
    }
  });
  feedparser.on("end", () => {
    callback(null, feedItems);
  });
  feedparser.on("error", err => {
    //winston.warn(err);
    callback(err);
  });
}

module.exports = searchCommons;