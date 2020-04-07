const axios = require('axios');

const Podcast = require('../../podcasts/models/podcast');
const Guest = require('../../people/models/guest');

const UserPodcast = require('../models/user-podcast');
const UserPodcastEpisode = require('../models/user-podcast-episode');
const UserEventOrganization = require('../models/user-event-organization');
const UserBusiness = require('../models/user-business');
const UserMediaOutlet = require('../models/user-media-outlet');
const UserConference =  require('../models/user-conference');
const UserGuest = require('../models/user-guest');

const EVENT_ORG_API = '/event-organizations/app/';
const BUSINESS_API = '/businesses/app/';
const MEDIA_API = '/media/app/';
const CONFERENCE_API = '/conferences/app/';

const contactDataFetcher = {
  addContactData: (listContact, callback) => {
    if (listContact.userPodcastId)
      contactDataFetcher.addPodcastContactData(listContact, callback);
    else if (listContact.userPodcastEpisodeId)
      contactDataFetcher.addEpisodeContactData(listContact, callback);
    else if (listContact.userEventOrganizationId)
      contactDataFetcher.addEventOrganizationContactData(listContact, callback);
    else if (listContact.userBusinessId)
      contactDataFetcher.addBusinessContactData(listContact, callback);
    else if (listContact.userMediaOutletId)
      contactDataFetcher.addMediaOutletContactData(listContact, callback);
    else if (listContact.userConferenceId)
      contactDataFetcher.addConferenceContactData(listContact, callback);
    else if (listContact.userGuestId)
      contactDataFetcher.addGuestContactData(listContact, callback);
  },

  addPodcastContactData: (listContact, callback) => {
    UserPodcast.findById(listContact.userPodcastId, (err, userPodcast) => {
      if (err) return callback(err);

      if (userPodcast.connected) return callback();

      Podcast.findOne({ listenNotesId: userPodcast.listenNotesId }).select('email').exec((err, podcast) => {
        if (err) return callback(err);

        UserPodcast.findByIdAndUpdate(userPodcast._id, { connected: true }, (err) => {
          if (err) return callback(err);

          callback(null, podcast.email);
        })
      })
    })
  },

  addEpisodeContactData: (listContact, callback) => {
    UserPodcastEpisode.findById(listContact.userPodcastEpisodeId, (err, userPodcastEpisode) => {
      if (err) return callback(err);

      if (userPodcastEpisode.connected) return callback();

      Podcast.findOne({ listenNotesId: userPodcastEpisode.episode.podcastListenNotesId }).select('email').exec((err, podcast) => {
        if (err) return callback(err);

        UserPodcastEpisode.findByIdAndUpdate(userPodcastEpisode._id, { connected: true }, (err) => {
          if (err) return callback(err);

          callback(null, podcast.email);
        })

      })
    })
  },

  addEventOrganizationContactData: (listContact, callback) => {
    UserEventOrganization.findById(listContact.userEventOrganizationId).lean().exec((err, userEventOrganization) => {
      if (err) return callback(err);

      if (userEventOrganization.connected) return callback();

      let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
      axios.get(process.env.MARKETING_SEARCH_URL + EVENT_ORG_API + userEventOrganization.eventOrganizationId + "/contact", { headers: { Authorization: authString } })
        .then(response => {
          const eventContactData = response.data;

          let updatedObject = Object.assign(userEventOrganization.eventOrganization, eventContactData);
          delete updatedObject.email;
          UserEventOrganization.findByIdAndUpdate(userEventOrganization._id, { eventOrganization: updatedObject, connected: true }, (err) => {
            if (err) return callback(err);

            callback(null, eventContactData.email);
          })
        })
        .catch(error => {
          callback(error);
        })

    })
  },

  addBusinessContactData: (listContact, callback) => {
    UserBusiness.findById(listContact.userBusinessId).lean().exec((err, userBusiness) => {
      if (err) return callback(err);

      if (userBusiness.connected) return callback();

      let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
      let type = userBusiness.business.organization ? 'national' : 'local';
      axios.get(process.env.MARKETING_SEARCH_URL + BUSINESS_API + type + "/" + userBusiness.businessId + "/contact", { headers: { Authorization: authString } })
        .then(response => {
          const businessData = response.data;

          let updatedObject = Object.assign(userBusiness.business, businessData);
          delete updatedObject.email;
          UserBusiness.findByIdAndUpdate(userBusiness._id, { business: updatedObject, connected: true }, (err) => {
            if (err) return callback(err);

            callback(null, businessData.email);
          })
        })
        .catch(error => {
          callback(error);
        })
    })
  },

  addMediaOutletContactData: (listContact, callback) => {
    UserMediaOutlet.findById(listContact.userMediaOutletId).lean().exec((err, userMediaOutlet) => {
      if (err) return callback(err);

      if (userMediaOutlet.connected) return callback();

      let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
      axios.get(process.env.MARKETING_SEARCH_URL + MEDIA_API + userMediaOutlet.mediaOutletId + "/contact", { headers: { Authorization: authString } })
        .then(response => {
          const mediaData = response.data;

          let updatedObject = Object.assign(userMediaOutlet.mediaOutlet, mediaData);
          delete updatedObject.email;
          UserMediaOutlet.findByIdAndUpdate(userMediaOutlet._id, { mediaOutlet: updatedObject, connected: true }, (err) => {
            if (err) return callback(err);

            callback(null, mediaData.email);
          })
        })
        .catch(error => {
          callback(error);
        })
    })
  },
  
  addConferenceContactData: (listContact, callback) => {
    UserConference.findById(listContact.userConferenceId).lean().exec((err, userConference) => {
      if (err) return callback(err);

      if (userConference.connected) return callback();

      let authString = 'Bearer ' + process.env.MARKETING_API_JWT;
      axios.get(process.env.MARKETING_SEARCH_URL + CONFERENCE_API + userConference.conferenceId + "/contact", { headers: { Authorization: authString } })
        .then(response => {
          const conferenceData = response.data;

          let updatedObject = Object.assign(userConference.conference, conferenceData);
          delete updatedObject.email;
          UserConference.findByIdAndUpdate(userConference._id, { conference: updatedObject, connected: true }, (err) => {
            if (err) return callback(err);

            callback(null, conferenceData.email);
          })
        })
        .catch(error => {
          callback(error);
        })
    })
  },

  addGuestContactData: (listContact, callback) => {
    UserGuest.findById(listContact.userGuestId, (err, userGuest) => {
      if (err) return callback(err);

      if (userGuest.connected) return callback();

      Guest.findById(userGuest.guestId, (err, guest) => {
        if (err) return callback(err);

        UserGuest.findByIdAndUpdate(userGuest._id, { connected: true }, (err) => {
          if (err) return callback(err);

          callback(null, guest.email);
        })
      })
    })
  }
}

module.exports = contactDataFetcher;