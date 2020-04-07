module.exports = {
  modelName: 'users',
  model: require('../../modules/users/models/user'),

  basicUsers: () => {
    return [
      {
        email: 'test1@email.com',
        name: 'Testie1'
      },
      {
        email: 'test2@email.com',
        name: 'Testie2'
      }
    ]
  }
}