const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let open = new Schema({
    outreachId: { type: Schema.Types.ObjectId, ref: 'outreachSequence', required: false },
    dateOpened: { type: Date, required: false },
});

open.index({ outreachId: 1 });

module.exports = mongoose.model('open', open);