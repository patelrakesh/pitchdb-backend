const Open = require('../models/open');
const winston = require('winston');
module.exports = {

  createFromOutreachSequence: (id, callback) => {
    let newOpen = new Open({ outreachId: id });
    newOpen.save(callback);
  },

  updateEmailOpened: id => {
    Open.findByIdAndUpdate(id, { dateOpened: new Date() }, (err) => {
      if (err) {
        winston.warn(err);
      }
    })
  }
}