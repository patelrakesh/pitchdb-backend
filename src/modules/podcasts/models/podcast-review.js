const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let podcastReview = new Schema({
  rating: { type: Number, required: true },
  date: { type: Date, required: false },
  title: { type: String, required: false },
  comment: { type: String, required: false },
  author: { type: String, required: false },
  podcastId: { type: String, required: true },
});

podcastReview.index({ podcastId: 1, author: 1 });

module.exports = mongoose.model('podcastReview', podcastReview, 'podcastReviews');