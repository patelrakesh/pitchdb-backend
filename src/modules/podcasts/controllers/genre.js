const Genre = require('../models/genre.js');

const genresController = {
  getGenresFromId: (idsArray, callback) => {
    Genre.find({ value: { $in: idsArray } }, (err, docs) => {
      if (err) callback(err);
      else {
        callback(null, docs);
      }
    });
  },

  getGenres: callback => {
    Genre.find({}).sort({ label: 1 }).exec((err, docs) => {
      if (err) callback(err);
      else {
        callback(null, docs);
      }
    })
  }
};

module.exports = genresController;