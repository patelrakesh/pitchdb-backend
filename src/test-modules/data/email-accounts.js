module.exports = {
  modelName: 'emailAccounts',
  model: require('../../modules/users/models/email-account'),

  basicAccounts: (users) => {
    return [
      {
        email: 'test1@email.com',
        network: 'gmail',
        userId: users[0]._id
      },
      {
        email: 'tes21@email.com',
        network: 'gmail',
        userId: users[1]._id
      }
    ]
  }
}