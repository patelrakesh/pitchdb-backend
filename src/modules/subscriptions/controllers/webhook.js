const Subscription = require('../models/subscription');
const User = require('../../users/models/user');
const subscriptionController = require('../controllers/subscription');
const CustomError = require('../../common/errors/custom-error');

const webhookController = {
  handleInvoiceUpcoming: (req, callback) => {
    callback();
  },

  handleInvoicePaymentSucceeded: (req, callback) => {
    const invoiceData = req.body.data.object;
    const lineItem = invoiceData.lines.data[0];

    let renewalDate = new Date(lineItem.period.start * 1000);
    let expDate = new Date(lineItem.period.end * 1000);
    expDate.setDate(expDate.getDate() + 1);
    Subscription.findOneAndUpdate({ stripeSubId: invoiceData.subscription }, {
      lastRenewWal: renewalDate,
      dateEnd: expDate,
      status: 'active'
    }, (err, subscription) => {
      if (err)
        callback(err);
      else {
        if (!subscription)
          callback(new CustomError("Subscription not found"));
        else {
          User.findById(subscription.userId, (err, user) => {
            if (err) callback(err)
            else {
              if(subscription.credits !== Number.POSITIVE_INFINITY){
                subscriptionController.addSubscriptionCredits(user, subscription, (err) => {
                  if (err) callback(err)
                  else callback(null, subscription);
                })
              }
            }
          })
        }
      }
    })
  },

  handleCustomerSubscriptionUpdated: (req, callback) => {

    const subscriptionData = req.body.data.object;
    const newStatus = subscriptionData.status;
    if (newStatus === 'canceled' || newStatus === 'unpaid') {
      handleCanceledOrUnpaid(subscriptionData, callback)
    }
    else {
      callback();
    }
  },
}

const handleCanceledOrUnpaid = (subscription, callback) => {
  Subscription.findOneAndUpdate({ stripeSubId: subscription.id }, {
    status: subscription.status,
    credits: 0
  }, (err, updatedSubscription) => {
    if (err)
      callback(err);
    else {
      if (!updatedSubscription)
        callback(new CustomError("Subscription not found"));
      else {
        User.findById(subscription.userId, (err, user) => {
          if (err) callback(err)
          else {
            subscriptionController.removeSubscriptionCredits(user, subscription, (err) => {
              if (err) callback(err)
              else callback(null, updatedSubscription);
            })
          }
        })
      }
    }
  })
}

module.exports = webhookController;