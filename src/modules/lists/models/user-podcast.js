const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userPodcast = new Schema({
  userId: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
  listenNotesId: { type: String, required: true },
  podcast: {
    title: { type: String, required: true },
    feedUrl: { type: String, required: true },
    description: { type: String, required: false },
    image: { type: String, required: false },
    genres: { type: [{ label: String }], required: false },
    iTunesId: { type: String, required: false },
    listenNotesId: { type: String, required: false },

    // Publisher
    publisherName: { type: String, required: false },

    // RSS feed additional data
    email: { type: String, required: false },
    hasEmail: { type: Boolean, required: false },
    owner: { type: String, required: false },
    officialUrl: { type: String, required: false },
    officialImage: { type: String, required: false },
    language: { type: String, required: false },
    copyright: { type: String, required: false },
    publishDate: { type: Date, required: false },
    _id: false,

    // Review Data
    rating: { type: Number, required: false },
    ratingsAmount: { type: Number, required: false }
  },
  date: { type: Date, default: Date.now },
  connected: { type: Boolean, default: false },
  oldUser: { type: String, default: 'none' }
});

userPodcast.index({ userId: 1, listenNotesId: 1, oldUser: 1 }, { unique: true });
userPodcast.index({ userId: 1, 'podcast.feedUrl': 1, oldUser: 1 }, { unique: true });

module.exports = mongoose.model('userPodcast', userPodcast, 'userPodcasts');