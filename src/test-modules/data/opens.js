module.exports = {
  modelName: 'opens',
  model: require('../../modules/outreach/models/open'),
  
  basicOpens: (sequences) => {
    return [
      {
        outreachId: sequences[0]._id,
        dateOpened: new Date()
      },
      {
        outreachId: sequences[1]._id
      }
    ]
  }
}