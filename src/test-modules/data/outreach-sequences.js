module.exports = {
  modelName: 'outreachSequences',
  model: require('../../modules/outreach/models/outreach-sequence'),

  basicOutreachSequences: (users, emailAccounts, userPodcasts, currentStage) => {
    return [
      {
        userId: users[0]._id,
        emailFrom: 'somerealorigemail@mail.com',
        emailTo: 'somerealdestemail@mail.com',
        userPodcastId: userPodcasts[0]._id,
        emailAccountId: emailAccounts[0]._id,
        currentStage: currentStage
      },
      {
        userId: users[1]._id,
        emailFrom: 'somerealorigemail@mail.com',
        emailTo: 'somefakedestemail@mail.com',
        userPodcastId: userPodcasts[1]._id,
        emailAccountId: emailAccounts[1]._id,
        currentStage: currentStage
      }
    ]
  }
}