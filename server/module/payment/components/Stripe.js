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
exports.charge = async options => stripe.charges.create(options);

exports.createAccount = async options => await stripe.accounts.create(options);
exports.updateAccount = async (id, options) => await stripe.accounts.update(id, options);
exports.retriveAccount = async id => await stripe.accounts.retrieve(id);

exports.createPerson = async ( account,options) => await stripe.accounts.createPerson(
  account,
  options
);

exports.updatePerson = async ( accountID,personID, options) => await stripe.accounts.updatePerson(
  accountID,
  personID,
  options
)

exports.payouts = async options => stripe.payouts.create(options);

exports.accountsList = async options => stripe.accounts.list(options);
exports.delAccounts = async id => stripe.accounts.del(id);
exports.transferCreate = async options => stripe.transfers.create(options);
