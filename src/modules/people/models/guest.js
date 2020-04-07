const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let guest = new Schema({

    // The important fields
    email: { type: String, required: false},
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    fullName: { type: String, required: false },
    company: { type: String, required: false },
    domain: { type: String, required: false },
    jobTitle: { type: String, required: false },
    image: { type: String, required: false },

    // Bonus info fields
    socialUrl: { type: String, required: false },
    twitter: { type: String, required: false },
    github: { type: String, required: false },
    location: { type: String, required: false },
    country: { type: String, required: false },
    phone: { type: String, required: false },
    source: { type: String, required: false },
    obtentionMethod: { type: String, required: false },
    description: { type: String, required: false },
    avatarUrl: { type: String, required: false },
    lastUpdated: { type: Date, required: false, default: Date.now },
    businessId: { type: String, required: false },

    // Email verification fields
    confidence: { type: Number, required: false },
    verification: { type: String, required: false },
    webmail: { type: Boolean, required: false },
    disposable: { type: Boolean, required: false }
});

guest.index({ firstName: 1, lastName: 1, company: 1 });
guest.index({ firstName: 1, lastName: 1, domain: 1 });
guest.index({ fullName: 1, company: 1,});
guest.index({ fullName: 1, domain: 1 });

guest.pre('save', next => {
    if (this.firstName) this.firstName = this.firstName.trim();
    if (this.lastName) this.lastName = this.lastName.trim();
    if (this.fullName) this.fullName = this.fullName.trim();
    if (this.company) this.company = this.company.trim();
    if (this.domain) this.domain = this.domain.trim();
    next();
});


module.exports = mongoose.model('guest', guest, 'guests');