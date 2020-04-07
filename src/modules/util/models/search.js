const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let search = new mongoose.Schema({
  type: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: 'user', required: false },
  teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
  keywords: { type: [String], required: true },
  filters: {
    _id: false,

    type: { type: String, required: false },

    // Podcast & episodes filters
    language: { type: String, required: false },
    genres: { type: [String], required: false, default: undefined },
    publishedAfter: { type: Date, required: false },
    publishedBefore: { type: Date, required: false },
    podcastSearch: { type: String, required: false },

    // Location filters
    country: { type: String, required: false },
    state: { type: String, required: false },
    city: { type: String, required: false },

    // Events filters
    location: { type: String, required: false },
    place: { type: String, required: false },
    month: { type: String, required: false },
    roleAtOrganization: { type: String, required: false },
    schoolType: { type: String, required: false },
    typeSearch: { type: String, required: false },

    // Business filters
    industry: { type: String, required: false },
    position: { type: String, required: false },
    description: { type: String, required: false },

    // Guests filters
    exclude: { type: [String], required: false, default: undefined },
    jobTitle: { type: String, required: false }

  },
  results: { type: Number, required: false }
});

module.exports = mongoose.model('search', search, "searches");