module.exports = {
  modelName: 'credits',
  model: require('../../modules/credits/models/credit'),

  basicCredits: (users, payments) => {
    return [
      {
        userId: users[0]._id,
        paymentId: payments[0]._id
      }
    ]
  }
}