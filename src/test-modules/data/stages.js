module.exports = {
  modelName: 'stages',
  model: require('../../modules/outreach/models/stage'),

  basicStages: (sequences, stageCategory) => {
    return [
      {
        sequence: sequences[0]._id,
        category: stageCategory
      },
      {
        sequence: sequences[1]._id,
        category: stageCategory
      }
    ]
  }
}