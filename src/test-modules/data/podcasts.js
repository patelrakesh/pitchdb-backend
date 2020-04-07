module.exports = {
  modelName: 'podcasts',
  model: require('../../modules/podcasts/models/podcast'),

  basicPodcasts: () => {
    return [
      {
        title: 'Test Podcast 1',
        email: 'sbeltrancaicedo@gmail.com',
        feedUrl: 'feed1.com',
        listenNotesId: 'LISTENNOTESID1'
      },
      {
        title: 'Test Podcast 2',
        email: 'sbeltrancaicedo@gmail.com',
        feedUrl: 'feed2.com',
        listenNotesId: 'LISTENNOTESID2'
      }
    ]
  }
}