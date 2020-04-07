/* eslint-disable linebreak-style */
const Subscription = require('../models/subscription');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const PlanDto = require('../dtos/plan');
const Credit = require('../../credits/models/credit');
const Counter = require('../../credits/models/counter');
const backErrorController = require('../../util/controllers/back-error');
const stripeCommon = require('../../util/controllers/stripe-common');

const subscriptionController = {
  createNewSubscription: (req, callback) => { 
    const user = req.decoded;
    const paymentData = req.body;

    const { planId } = paymentData;

    stripeCommon.findOrCreateStripeCustomer(user, paymentData.token.id, (err, customer) => {
      if (err) callback(err)
      else {
        stripe.subscriptions.create({
          cancel_at_period_end: false,
          customer: customer.id,
          items: [{ plan: planId }],
        }, (err, subscription) => {
          if (err) callback(err)
          else {
            // Set the type of subscription and dates
            subscriptionController.getPlanById(planId, (err, plan) => {
              if (err) callback(err)
              else {
                let expDate = new Date(subscription.current_period_end * 1000);
                expDate.setDate(expDate.getDate() + 1);
                let credits;
                if(plan.metadata.app_credits === 'unlimited'){
                  credits = Number.POSITIVE_INFINITY
                }
                else{
                  credits = Number(plan.metadata.app_credits)
                }
                
                const newSubscription = new Subscription({
                  userId: user.userId,
                  type: plan.metadata.app_name,
                  status: 'active',
                  dateStart: new Date(subscription.current_period_start * 1000),
                  lastRenewWal: new Date(subscription.current_period_start * 1000),
                  dateEnd: expDate,
                  stripeSubId: subscription.id,
                  credits: credits,
                  planId: plan.id
                })
                newSubscription.save((err, createdSubscription) => {
                  if (err) callback(err)
                  else{
                    if(plan.metadata.app_credits === 'unlimited'){
                      subscriptionController.addUnlimitedSubscriptionCredits(user, createdSubscription, callback)
                    }
                    else{
                      subscriptionController.addSubscriptionCredits(user, createdSubscription, callback)
                    }
                  }
                })
              }
            })
          }
        });
      }
    })
  },

  updateSubscription: (req, callback) => { 
    const upgradeData = req.body;

    subscriptionController.getUserCurrentSubscription(req, (err, userSubscription) => {
      if (err) callback(err)
      else {

        stripe.subscriptions.retrieve(userSubscription.stripeSubId,
          (err, stripeSubscription) => {
            if (err) callback(err)
            else {
              stripe.subscriptions.update(userSubscription.stripeSubId, {
                cancel_at_period_end: false,
                items: [{
                  id: stripeSubscription.items.data[0].id,
                  plan: upgradeData.planId,
                }]
              }, (err, subscription) => {
                if (err) callback(err)
                else {
                  subscriptionController.getPlanById(upgradeData.planId, (err, plan) => {
                    if (err) callback(err)
                    else {
                      let expDate = new Date(subscription.current_period_end * 1000);
                      expDate.setDate(expDate.getDate() + 1);

                      let credits;
                      if(plan.metadata.app_credits === 'unlimited'){
                        credits = Number.POSITIVE_INFINITY
                      }
                      else{
                        credits = Number(plan.metadata.app_credits)
                      }

                      Subscription.findOneAndUpdate({ _id: userSubscription._id },
                        {
                          type: plan.metadata.app_name,
                          status: 'active',
                          lastRenewWal: new Date(subscription.current_period_start * 1000),
                          dateEnd: expDate,
                          stripeSubId: subscription.id,
                          credits: credits,
                          planId: plan.id,
                          scheduledToCancel: false
                        }, { new: true }, (err, updatedSubscription) => {
                          if (err) callback(err)
                          else {
                            if(updatedSubscription.credits === Number.POSITIVE_INFINITY){
                              subscriptionController.addUnlimitedSubscriptionCredits(req.decoded, updatedSubscription, (err) => {
                                if (err) callback(err)
                                else callback(null, updatedSubscription)
                              })
                            }
                            else if(userSubscription.credits === Number.POSITIVE_INFINITY){
                              subscriptionController.manageUnlimitedSubscriptionCredits(req.decoded, updatedSubscription, (err) => {
                                if (err) callback(err)
                                else callback(null, updatedSubscription)
                              })
                            }
                            else if (userSubscription.credits < updatedSubscription.credits)
                              subscriptionController.addSubscriptionCredits(req.decoded, updatedSubscription, (err) => {
                                if (err) callback(err)
                                else callback(null, updatedSubscription)
                              })
                            else
                              subscriptionController.removeSubscriptionCredits(req.decoded, updatedSubscription, (err) => {
                                if (err) callback(err)
                                else callback(null, updatedSubscription)
                              })
                          }
                        })
                    }
                  })
                }
              });
            }
          })
      }
    })
  },

  cancelSubscription: (req, callback) => {
    subscriptionController.getUserCurrentSubscription(req, (err, userSubscription) => {
      if (err) callback(err)
      else {
        stripe.subscriptions.update(userSubscription.stripeSubId,
          {
            cancel_at_period_end: true
          }, (err) => {
            if (err) callback(err)
            else {
              Subscription.findOneAndUpdate({ _id: userSubscription._id },
                {
                  scheduledToCancel: true
                }, { new: true }, callback)
            }
          });
      }
    })
  },

  getStripePlans: (callback) => {
    stripe.plans.list(
      {
        limit: 100,
        active: true
      },
      (err, stripePlans) => {
        if (err) callback(err)
        else {
          let plans = [];
          for (const stripePlan of stripePlans.data) {
            plans.push(new PlanDto(stripePlan))
          }
          callback(null, plans.sort((planA, planB) => {
            if (planA.price > planB.price)
              return 1
            else if (planA.price < planB.price)
              return -1
            else return 0
          }))
        }
      });
  },

  getPlanById: (planId, callback) => {
    stripe.plans.retrieve(planId, callback)
  },

  getUserCurrentSubscription: (req, callback) => {
    Subscription.findOne({ userId: req.decoded.userId, status: 'active' }).sort('-lastRenewWal').exec(callback)
  },

  addSubscriptionCredits: (user, subscription, callback) => {
    const userId = user.userId ? user.userId : user._id

    // Find amount of remaining subscription credits for the user
    Credit.countDocuments({ userId, dateLastRefund: null, dateConsumed: null, subscription: true }, (err, count) => {
      if (err) {
        callback(err)
      }
      else {
        const amountToInsert = subscription.credits - count
        if (amountToInsert <= 0) {
          callback()
        }
        else {
          let creditsArray = [];
          for (let i = 0; i < amountToInsert; i++) {
            creditsArray.push({
              userId,
              teamId: user.teamId,
              bundleType: 'subscription',
              subscription: true
            })
          }

          Credit.insertMany(creditsArray, err => {
            if (err) {
              backErrorController.persistError({
                module: "subscription",
                message: `Error persisting credits for u: ${userId} t: ${user.teamId}  subId: ${subscription._id}`
              });
              callback(err);
            }
            else {
              Counter.updateOne({ userId: userId }, { remaining: (subscription.credits) }, (err) => {
                if (err) {
                  backErrorController.persistError({
                    module: "subscription",
                    message: `Error updating counter for u: ${userId} t: ${user.teamId}  subId: ${subscription._id}`
                  });
                  callback(err);
                }
                else callback(null, subscription);
              })
            }
          });
        }
      }
    })
  },

  addUnlimitedSubscriptionCredits: (user, subscription, callback) => {
    const userId = user.userId ? user.userId : user._id
    
    Counter.findOneAndUpdate({ userId: userId }, { remaining: Number.POSITIVE_INFINITY }, (err) => {
      if (err) {
        backErrorController.persistError({
          module: "subscription",
          message: `Error updating counter for u: ${userId} t: ${user.teamId}  subId: ${subscription._id}`
        });
        callback(err);
      }
      else callback(null, subscription);
    })
         
  },

  removeSubscriptionCredits: (user, subscription, callback) => {
    const userId = user.userId ? user.userId : user._id

    // Find amount of remaining subscription credits for the user
    Credit.find({ userId, dateLastRefund: null, dateConsumed: null, subscription: true }, (err, credits) => {
      if (err) {
        callback(err)
      }
      else {
        const amountToRemove = credits.length - subscription.credits
        if (amountToRemove <= 0) {
          callback()
        }
        else {
          let creditsIdsToRemove = []
          for (let i = 0; i < amountToRemove; i++) {
            creditsIdsToRemove.push(credits[i]._id)
          }

          Credit.deleteMany({ _id: { $in: creditsIdsToRemove } }, err => {
            if (err) {
              backErrorController.persistError({
                module: "subscription",
                message: `Error deleting credits for u: ${userId} t: ${user.teamId}  subId: ${subscription._id}`
              });
              callback(err);
            }
            else {
              Counter.updateOne({ userId: userId }, { remaining: (subscription.credits) }, (err) => {
                if (err) {
                  backErrorController.persistError({
                    module: "subscription",
                    message: `Error updating counter for u: ${userId} t: ${user.teamId}  subId: ${subscription._id}`
                  });
                  callback(err);
                }
                else callback(null, subscription);
              })
            }
          });
        }
      }
    })
  },

  manageUnlimitedSubscriptionCredits: (user, subscription, callback) => {
    const userId = user.userId ? user.userId : user._id

    // Find amount of remaining subscription credits for the user
    Credit.find({ userId, dateLastRefund: null, dateConsumed: null, subscription: true }, (err, credits) => {
      if (err) {
        callback(err)
      }
      else {
        if(credits.length > subscription.credits){
          subscriptionController.removeSubscriptionCredits(user, subscription, callback)
        } else if(credits.length < subscription.credits){
          subscriptionController.addSubscriptionCredits(user,subscription,callback)
        } else{
          callback()
        }
      }
    })
  }
}

module.exports = subscriptionController;