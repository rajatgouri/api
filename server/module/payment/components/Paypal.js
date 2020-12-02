/* eslint no-return-assign: 0 */
const paypal = require('paypal-rest-sdk');
const url = require('url');
const nconf = require('nconf');

exports.createSubscriptionPlan = async (key, options) => {
  try {
    paypal.configure(options.config);
    const billingPlanAttributes = {
      description: options.description,
      merchant_preferences: {
        auto_bill_amount: 'yes',
        cancel_url: options.cancelUrl,
        initial_fail_amount_action: 'continue',
        max_fail_attempts: '1',
        return_url: options.returnUrl,
        setup_fee: {
          currency: options.currency || 'USD',
          value: '0'
        }
      },
      name: options.name,
      payment_definitions: [{
        amount: {
          currency: process.env.SITE_CURRENCY,
          value: options.price
        },
        charge_models: [],
        cycles: '0',
        frequency: 'MONTH', // TODO - define me
        frequency_interval: '1',
        name: options.name,
        type: 'REGULAR'
      }],
      type: 'INFINITE'
    };

    return new Promise((resolve, reject) => {
      paypal.billingPlan.create(billingPlanAttributes, async (error, billingPlan) => {
        if (error) {
          return reject(error);
        }

        // Activate the plan by changing status to Active
        const billingPlanUpdateAttributes = [{
          op: 'replace',
          path: '/',
          value: { state: 'ACTIVE' }
        }];
        return paypal.billingPlan.update(billingPlan.id, billingPlanUpdateAttributes, async (err) => {
          if (err) {
            return reject(err);
          }

          const billing = billingPlan;
          billing.state = 'active';

          // create webhook
          // https://github.com/paypal/PayPal-REST-API-issues/issues/99
          // subscribe for PAYMENT.SALE.COMPLETED only
          // https://github.com/paypal/PayPal-REST-API-issues/issues/228
          // There's an issue with sandbox webhooks. It's sort of on and off at this time. We are pushing to get it fixed
          // but it should not happen in production environment.
          // Webhooks is recommended for REST API. I don't have info on IPN configuration.
          // https://stackoverflow.com/questions/26351367/paypal-rest-api-billing-agreements-webhooks
          // {
          //    ...
          //    "resource": {
          //        ...
          //        "billing_agreement_id": "I-38097XVV6XVU"
          //        ...
          //    }
          //    ...
          // }
          // A list of all event names can be found here: https://developer.paypal.com/docs/integration/direct/webhooks/event-names/
          const webhookData = {
            url: url.resolve(nconf.get('baseUrl'), '/v1/payment/paypal/hook'),
            event_types: [
              { name: 'PAYMENT.SALE.COMPLETED' }
            ]
          };

          return paypal.notification.webhook.create(webhookData, () => resolve(billing));
        });
      });
    });
  } catch (e) {
    throw e;
  }
};

exports.createSinglePayment = async (options) => {
  try {
    paypal.configure(options.config);

    const paymentData = {
      intent: 'sale',
      payer: { payment_method: 'paypal' },
      redirect_urls: {
        return_url: options.returnUrl, // success redirect after finish
        cancel_url: options.cancelUrl
      },
      transactions: [{
        amount: {
          currency: options.currency || 'USD',
          total: typeof options.price === 'string' ? options.price : options.price.toFixed(2)
        },
        description: options.description || 'Payment'
      }]
    };
    return new Promise((resolve, reject) => {
      paypal.payment.create(paymentData, (err, payment) => {
        if (err) {
          return reject(err);
        }
        // populate for custom data
        const data = Object.assign({}, payment);
        data.links = {};
        payment.links.forEach(link => data.links[link.rel] = link.href);
        data.token = url.parse(data.links.approval_url, true).query.token;

        return resolve(data);
      });
    });
  } catch (e) {
    throw e;
  }
};

exports.createSubscriptionPayment = async (subscriptionPlan, options) => {
  // check recurring here https://developer.paypal.com/docs/integration/direct/create-billing-plan/
  // sample here https://github.com/paypal/PayPal-node-SDK/blob/master/samples/subscription
  try {
    paypal.configure(options.config);

    // Create the billing plan
    return new Promise((resolve, reject) => {
      // Use activated billing plan to create agreement
      const isoDate = new Date();
      isoDate.setSeconds(isoDate.getSeconds() + 10);
      const startDate = `${isoDate.toISOString().slice(0, 19)}Z`;
      const billingAgreementAttributes = {
        name: options.name,
        description: options.description,
        start_date: startDate,
        plan: { id: subscriptionPlan.id },
        payer: {
          payment_method: 'paypal'
        }
      };
      paypal.billingAgreement.create(billingAgreementAttributes, (err, billingAgreement) => {
        if (err) {
          return reject(err);
        }
        const data = Object.assign({}, billingAgreement);
        data.links = {};
        billingAgreement.links.forEach(link => data.links[link.rel] = link.href);
        data.token = url.parse(data.links.approval_url, true).query.token;
        return resolve(data);
      });
    });
  } catch (e) {
    throw e;
  }
};

exports.getDetails = async (options, paymentId) => new Promise((resolve, reject) => {
  paypal.configure(options.config);
  return paypal.payment.get(paymentId, (error, payment) => {
    if (error) {
      return reject(error);
    }

    return resolve(payment);
  });
});

exports.billingAgreementSubscription = async (options, paymentToken) => new Promise((resolve, reject) => {
  paypal.configure(options.config);
  paypal.billingAgreement.execute(paymentToken, {}, (error, billingAgreement) => {
    if (error) {
      return reject(error);
    }

    return resolve(billingAgreement);
  });
});

exports.executeSinglePayment = async (options) => {
  try {
    paypal.configure(options.config);
    const paymentJson = {
      payer_id: options.payerId,
      transactions: [{
        amount: {
          currency: options.currency || 'USD',
          total: options.price.toFixed(2)
        }
      }]
    };

    return new Promise((resolve, reject) => {
      paypal.payment.execute(options.paymentId, paymentJson, (error, payment) => {
        if (error) {
          return reject(error);
        }

        return resolve(payment);
      });
    });
  } catch (e) {
    throw e;
  }
};


exports.do_payout = async (options) => {
  try {
    paypal.configure(options.config);
    var sender_batch_id = Math.random().toString(36).substring(9);
    const requestBody = {
      sender_batch_header: {
        recipient_type: "EMAIL",
        sender_batch_id:sender_batch_id,
        email_subject: 'You have a new payout'
      },
      items: [{
        amount: {
          currency: 'USD',
          value: "10"
        },
        sender_item_id: "201403140003",
        receiver: "payouts-simulator-receiver@paypal.com"
      }]
    };

    var sync_mode = 'false';

    return new Promise((resolve, reject) => {
      paypal.payout.create(requestBody, sync_mode,(error, payment) => {
        if (error) {
          console.log(error);
          return reject(error);
        }

        return resolve(payment);
      });
    });
  } catch (e) {
    throw e;
  }
};