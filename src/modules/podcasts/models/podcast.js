const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let podcast = new Schema({

  // Podcast
  title: { type: String, required: true },
  feedUrl: { type: String, required: false, unique: true },
  description: { type: String, required: false },
  image: { type: String, required: false },
  genres: { type: [], required: false },
  iTunesId: { type: String, required: false },
  listenNotesId: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now },

  // Publisher
  publisherName: { type: String, required: false },

  // RSS feed additional data
  email: { type: String, required: false },
  verification: { type: String, required: false },
  owner: { type: String, required: false },
  link: { type: String, required: false },
  language: { type: String, required: false },
  copyright: { type: String, required: false },
  publishDate: { type: Date, required: false },
  generator: { type: String, required: false },
  docs: { type: String, required: false },

  // Review Data
  rating: { type: Number, required: false },
  ratingsAmount: { type: Number, required: false },

  needsUpdate: { type: Boolean, default: false }
});

podcast.index({ listenNotesId: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('podcast', podcast, 'podcasts');