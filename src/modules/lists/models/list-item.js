const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let listItem = new mongoose.Schema({

  listId: { type: Schema.Types.ObjectId, ref: 'list', required: true },
  userPodcast: { type: Schema.Types.ObjectId, ref: 'userPodcast', required: false },
  userPodcastEpisode: { type: Schema.Types.ObjectId, ref: 'userPodcastEpisode', required: false },
  userEventOrganization: { type: Schema.Types.ObjectId, ref: 'userEventOrganization', required: false },
  userBusiness: { type: Schema.Types.ObjectId, ref: 'userBusiness', required: false },
  userMediaOutlet: { type: Schema.Types.ObjectId, ref: 'userMediaOutlet', required: false },
  userConference: { type: Schema.Types.ObjectId, ref: 'userConference', required: false },
  userGuest: { type: Schema.Types.ObjectId, ref: 'userGuest', required: false },
  date: { type: Date, required: true, default: Date.now }

});

listItem.index({ listId: 1, userPodcast: 1 }, { unique: true, partialFilterExpression: { userPodcast: { $exists: true } } });
listItem.index({ listId: 1, userPodcastEpisode: 1 }, { unique: true, partialFilterExpression: { userPodcastEpisode: { $exists: true } } });
listItem.index({ listId: 1, userEventOrganization: 1 }, { unique: true, partialFilterExpression: { userEventOrganization: { $exists: true } } });
listItem.index({ listId: 1, userBusiness: 1 }, { unique: true, partialFilterExpression: { userBusiness: { $exists: true } } });
listItem.index({ listId: 1, userMediaOutlet: 1 }, { unique: true, partialFilterExpression: { userMediaOutlet: { $exists: true } } });
listItem.index({ listId: 1, userConference: 1 }, { unique: true, partialFilterExpression: { userConference: { $exists: true } } });
listItem.index({ listId: 1, userGuest: 1 }, { unique: true, partialFilterExpression: { userGuest: { $exists: true } } });

module.exports = mongoose.model('listItem', listItem, 'listItems');