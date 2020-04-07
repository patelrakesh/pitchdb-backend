const mongoose = require('mongoose');
const winston = require('winston');
const async = require('async');

let staging = {
  insertDocuments: (docList, { model, modelName }) => {
    return new Promise((resolve, reject) => {
      model.insertMany(docList, (err, savedDocs) => {
        if (err) reject(err)
        else {
          staging.data[modelName] = savedDocs
          resolve(savedDocs)
        }
      })
    })
  },

  deleteDocuments: (modelsList) => {
    return new Promise((resolve) => {
      async.map(modelsList,
        (model, next) => {
          mongoose.model(model).deleteMany({}, (err) => {
            if (err) winston.warn(err)
            next()
          })
        },
        () => {
          resolve()
        })
    })
  },

  data: {}
}

module.exports = staging