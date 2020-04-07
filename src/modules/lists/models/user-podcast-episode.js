const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userPodcastEpisode = new Schema({
  userId: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
  listenNotesId: { type: String, required: true },
  episode: {
    title: { type: String, required: true },
    description: { type: String, required: false },
    podcastTitle: { type: String, required: false },
    image: { type: String, required: false },
    publishDate: { type: Date, required: false },
    listenNotesId: { type: String, required: false },
    iTunesId: { type: String, required: false },
    podcastListenNotesId: { type: String, required: false },
    genres: { type: [{ label: String }], required: false },
    podcast: { type: Schema.Types.ObjectId, ref: 'podcast', required: false },
    publisherName: { type: String, required: false },
    duration: { type: String, required: false },
    audio: { type: String, required: false },

    // RSS feed
    link: { type: String, required: false },
    keywords: { type: String, required: false },
    hasEmail: { type: Boolean, required: false },
    _id: false
  },
  date: { type: Date, default: Date.now },
  connected: { type: Boolean, default: false },
  oldUser: { type: String, default: 'none' }
});

userPodcastEpisode.index({ userId: 1, listenNotesId: 1, oldUser: 1 }, { unique: true });

module.exports = mongoose.model('userPodcastEpisode', userPodcastEpisode, 'userPodcastEpisodes');