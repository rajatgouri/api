const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_API_SECRET);

/**
 * https://stripe.com/docs/api/node#create_charge
 * @param {Object} options {
    amount: 2000,
    currency: "usd",
    source: "tok_amex", // obtained with Stripe.js
    description: "Charge for jenny.rosen@example.com"
  }
 */
exports.refund = async options => stripe.refunds.create(options);
