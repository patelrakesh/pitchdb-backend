const Payment = require('../models/payment');
const Bundle = require('../models/bundle');
const CustomError = require('../../common/errors/custom-error');
const creditController = require('../controllers/credit');
const winston = require('winston');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const stripeCommon = require('../../util/controllers/stripe-common');


const paymentController = {
  purchaseBundle: (req, callback) => {
    const user = req.decoded;
    const paymentData = req.body;

    Bundle.findById(paymentData.bundleId, (err, bundle) => {
      if (err) callback(err)
      else
        stripeCommon.findOrCreateStripeCustomer(user, paymentData.token.id, (err, customer) => {
          if (err) callback(err);
          else {
            let chargeObj = {
              currency: "USD",
              receipt_email: user.email,
              statement_descriptor: "Pitchdb " + bundle.type,
              description: bundle.type + " credits bundle",
              amount: bundle.price * 100,
              metadata: {
                'user-name': user.name,
                'user-id': user.userId,
                'bundle-type': bundle.type,
                'bundle-credits': bundle.amount,
                'bundle-price': bundle.price
              },
              customer: customer.id
            }

            processCharge(req, chargeObj, bundle, customer, callback);
          }
        })
    })
  }
};

const processCharge = (req, chargeObj, bundle, customer, callback) => {
  const user = req.decoded;
  const paymentData = req.body;

  stripe.charges.create(chargeObj, (err, charge) => {
    if (err) callback(new CustomError(err.message, err.statusCode));
    else {
      let returnObj = {
        success: true
      }
      // Det if payment successful
      if (!returnObj.success)
        processPaymentResult(req, returnObj, bundle, callback);
      else
        createPayment(user, bundle, charge, (err, payment) => {
          if (err) callback(err);
          else {
            returnObj.payment = payment;
            if (!customer || !customer.id) {
              createStripeCustomer(user, paymentData.token, (err, customer) => {
                if (err) {
                  winston.error(err);
                }
                else returnObj.customerId = customer.id;
                processPaymentResult(req, returnObj, bundle, callback);
              })
            }
            else processPaymentResult(req, returnObj, bundle, callback);
          }
        })
    }
  });
}

const createStripeCustomer = (user, token, callback) => {
  stripe.customers.create({
    description: 'Customer for ' + user.email,
    email: user.email,
    source: token.card.id
  }, callback);
}

const createPayment = (user, bundle, charge, callback) => {
  let newPayment = new Payment({
    userId: user.userId,
    bundleType: bundle.type,
    bundlePrice: bundle.price,
    bundleAmount: bundle.amount,
    method: 'stripe',
    data: {
      chargeId: charge.id
    },
    orderNumber: Math.floor(Math.random() * (9999999 - 1000000 + 1) + 1000000)
  });
  newPayment.save(callback);
}

const processPaymentResult = (req, paymentResult, bundle, callback) => {
  if (!paymentResult.success)
    callback(paymentResult.error);
  else {
    creditController.obtainBundle(req.decoded.userId, req.decoded.teamId, bundle, paymentResult._id, (err) => {
      if (err) callback(err);
      else
        callback(null, {
          orderBundle: bundle.type,
          orderAmount: bundle.amount,
          orderPrice: bundle.price,
          orderNumber: paymentResult.payment.orderNumber,
          orderDate: paymentResult.payment.date
        });
    })
  }
}

module.exports = paymentController;