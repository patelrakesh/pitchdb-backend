const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let podcastEpisode = new Schema({

  // PodcastEpisode
  title: { type: String, required: true },
  description: { type: String, required: false },
  podcastTitle: { type: String, required: false },
  image: { type: String, required: false },
  publishDate: { type: Date, required: false },
  listenNotesId: { type: String, required: false },
  iTunesId: { type: String, required: false },
  podcastListenNotesId: { type: String, required: false },
  podcast: { type: Schema.Types.ObjectId, ref: 'podcast', required: false },
  publisherName: { type: String, required: false },
  dateAdded: { type: Date, default: Date.now },

  // RSS feed
  duration: { type: String, required: false },
  link: { type: String, required: false },
  keywords: { type: [], required: false },
  episodeNumber: { type: Number, required: false },
  enclosure: { type: Object, required: false },

  // Playback data
  playLength: { type: Number, required: false },
  playType: { type: String, required: false },
  playUrl: { type: String, required: false },

});

podcastEpisode.index({ podcast: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('podcastEpisode', podcastEpisode, 'podcastEpisodes');