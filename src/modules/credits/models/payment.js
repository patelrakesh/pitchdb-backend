const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let payment = new Schema({
    date: { type: Date, required: false, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    bundleType: { type: String, required: false },
    bundlePrice: {type: Number, required: false},
    bundleAmount: {type: Number, required: false},
    method: { type: String, required: true },
    data: { type: Object, required: false },
    orderNumber: {type: Number, required: true}
});
module.exports = mongoose.model('payment', payment);