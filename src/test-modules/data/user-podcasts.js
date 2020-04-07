module.exports = {
  modelName: 'userPodcasts',
  model: require('../../modules/lists/models/user-podcast'),

  basicUserPodcasts: (users, podcasts) => {
    return [
      {
        userId: users[0]._id,
        listenNotesId: podcasts[0].listenNotesId,
        podcast: {
          title: podcasts[0].title,
          feedUrl: podcasts[0].feedUrl
        }
      },
      {
        userId: users[1]._id,
        listenNotesId: podcasts[1].listenNotesId,
        podcast: {
          title: podcasts[1].title,
          feedUrl: podcasts[1].feedUrl
        }
      }
    ]
  }
}