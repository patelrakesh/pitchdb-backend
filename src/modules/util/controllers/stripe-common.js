const User = require('../../users/models/user');
const stripe = require('stripe')(process.env.STRIPE_KEY);

module.exports = {
  findOrCreateStripeCustomer: (user, source, callback) => {
    if (user.stripeCustomerId) {
      stripe.customers.retrieve(user.stripeCustomerId, callback);
    }
    else {
      stripe.customers.create({
        email: user.email,
        source,
        metadata: {
          pitchDBId: user.userId,
          name: user.name
        }
      }, (err, customer) => {
        if (err) callback(err);
        else {
          User.findByIdAndUpdate(user.userId, { stripeCustomerId: customer.id }, (err) => {
            if (err) callback(err);
            else callback(null, customer);
          })
        }
      });
    }
  },
}