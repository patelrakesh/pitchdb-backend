const Activity = require('../classes/activity');
const Stage = require('../../outreach/models/stage');

const activityController = {
  getLatest: (req, callback) => {
    let query = {}
    if (req.decoded.teamId)
      query.teamId = req.decoded.teamId;
    else
      query.userId = req.decoded.userId;

    //.populate({ path: 'nested', populate: { path: 'deepNested' }});

    Stage.find(query).sort('-date').populate(
      [
        {
          path: 'sequence',
          populate: [
            { path: 'userPodcastId', select: 'podcast.title' },
            { path: 'userPodcastEpisodeId', select: 'episode.podcastTitle' },
            { path: 'userEventOrganizationId', select: 'eventOrganization.schoolName eventOrganization.organization' },
            { path: 'userBusinessId', select: 'business.companyName business.organization' },
            { path: 'userMediaOutletId', select: 'mediaOutlet.companyName' },
            { path: 'userGuestId', select: 'guest.fullName' }
          ]
        }
      ]
    )
      .limit(10)
      .exec((err, stages) => {
        if (err) callback(err);
        else
          callback(null,
            stages.map(stage =>
              new Activity(stage, 'stage')
            ));
      });
  }

}

module.exports = activityController;