const stagesConstants = require('../../outreach/constants/stages');

class Activity {
  constructor (data, type) {
    this.type = type;
    switch (type) {
      case 'stage':
        this.date = data.date;

        const sequence = data.sequence; // eslint-disable-line no-case-declarations
        let contactType; // eslint-disable-line no-case-declarations
        let contactText; // eslint-disable-line no-case-declarations

        if (sequence.userPodcastId) {
          contactType = 'podcast';
          contactText = sequence.userPodcastId.podcast.title;
        }
        else if (sequence.userPodcastEpisodeId) {
          contactType = 'podcast';
          contactText = sequence.userPodcastEpisodeId.episode.podcastTitle;
        }
        else if (sequence.userEventOrganizationId) {
          contactType = 'organization';
          contactText = sequence.userEventOrganizationId.eventOrganization.schoolName ||
            sequence.userEventOrganizationId.eventOrganization.organization;
        }
        else if (sequence.userBusinessId) {
          contactType = 'business';
          contactText = sequence.userBusinessId.business.companyName ||
            sequence.userBusinessId.business.organization;
        }
        else if (sequence.userGuestId) {
          contactType = 'guest';
          contactText = sequence.userGuestId.guest.fullName;
        }

        switch (data.category) {
          case stagesConstants.WAITING:
            this.message = `Created outreach sequence for the ${contactType} "${contactText}".`;
            break;
          case stagesConstants.SENT:
            this.message = `Sent outreach message to ${contactType} "${contactText}".`;
            break;
          case stagesConstants.OPENED:
            this.message = `The ${contactType} "${contactText}" opened your outreach message.`;
            break;
          case stagesConstants.REPLIED || stagesConstants.CONVERSED:
            this.message = `The ${contactType} "${contactText}" replied to your outreach message.`;
            break;
          case stagesConstants.BOOKED:
            this.message = `You booked the outreach sequence for the ${contactType} "${contactText}".`;
            break;
          case stagesConstants.BOUNCED:
            this.message = `The outreach message for the ${contactType} "${contactText}" bounced.`;
            break;
          case stagesConstants.POSTPONED:
            this.message = `You postponed the outreach sequence for the ${contactType} "${contactText}".`;
            break;
          default:
            break;
        }

        break;
      default:
        break;
    }
  }
}

module.exports = Activity;