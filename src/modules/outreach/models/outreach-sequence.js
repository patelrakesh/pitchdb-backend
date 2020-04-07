/* eslint-disable linebreak-style */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let outreachSequence = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
  listId: { type: Schema.Types.ObjectId, ref: 'list', required: true },
  emailFrom: { type: String, required: false },
  emailTo: { type: String, required: true },

  listItemId: { type: Schema.Types.ObjectId, ref: 'listItem', required: false },
  userPodcastId: { type: Schema.Types.ObjectId, ref: 'userPodcast', required: false },
  userPodcastEpisodeId: { type: Schema.Types.ObjectId, ref: 'userPodcastEpisode', required: false },
  userEventOrganizationId: { type: Schema.Types.ObjectId, ref: 'userEventOrganization', required: false },
  userBusinessId: { type: Schema.Types.ObjectId, ref: 'userBusiness', required: false },
  userMediaOutletId: { type: Schema.Types.ObjectId, ref: 'userMediaOutlet', required: false },
  userConferenceId: { type: Schema.Types.ObjectId, ref: 'userConference', required: false },
  userGuestId: { type: Schema.Types.ObjectId, ref: 'userGuest', required: false },
  emailAccountId: { type: Schema.Types.ObjectId, ref: 'emailAccount' },
  date: { type: Date, required: true, default: Date.now },
  currentStage: { type: String, required: true, default: 'waiting' },

  currentMessage: { type: Number, required: true, default: 1 },
  active: { type: Boolean, default: false },

  notes: {type: [{title:String, content:String, date: Date, editDate: Date}]}

});

module.exports = mongoose.model('outreachSequence', outreachSequence, 'outreachSequences');