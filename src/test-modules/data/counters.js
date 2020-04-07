module.exports = {
  modelName: 'counters',
  model: require('../../modules/credits/models/counter'),

  basicCounters: (users) => {
    return [
      {
        userId: users[0]._id
      }
    ]
  }
}