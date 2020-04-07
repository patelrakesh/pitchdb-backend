const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let emailReport = new Schema({
  outreachId: { type: Schema.Types.ObjectId, ref: 'outreachSequence', required: false },
  date: { type: Date, default: Date.now },
  description: { type: String },
  status: {type: String, default: 'open'}
});

emailReport.index({ outreachId: 1 });

module.exports = mongoose.model('emailReport', emailReport, 'emailReports');