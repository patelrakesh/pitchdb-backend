module.exports = {
  modelName: 'payments',
  model: require('../../modules/credits/models/payment'),

  basicPayments: (users) => {
    return [
      {
        method: 'test',
        orderNumber: 123,
        userId: users[0]._id
      }
    ]
  }
}