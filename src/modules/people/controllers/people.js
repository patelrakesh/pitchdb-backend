const Guest = require('../models/guest');

const guestController = {
  findById: (id, callback) => {
    Guest.findById(id, (err, doc) => {
      if (err) callback(err);
      else callback(null, doc);
    })
  }
};

module.exports = guestController;