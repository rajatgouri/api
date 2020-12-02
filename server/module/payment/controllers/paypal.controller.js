exports.callback = async (req, res, next) => {
  try {
    if (!req.query.token) {
      return res.status(403).end();
    }

    if (req.query.action === 'success') {
      const transaction = await DB.Transaction.findOne({
        paymentToken: req.query.token
      });
      if (!transaction) {
        return next(PopulateResponse.notFound());
      }

      if (['shop_featured', 'order'].indexOf(transaction.type) > -1) {
        // TODO - check payer id, etc
        await Service.Payment.executePaypalSinglePayment(transaction, req.query);
      } else {
        return next(PopulateResponse.forbidden());
      }

      if (transaction.meta && transaction.meta.redirectSuccessUrl) {
        return res.redirect(transaction.meta.redirectSuccessUrl);
      }
    } else {
      const transaction = await DB.Transaction.findOneAndUpdate({
        paymentToken: req.query.token
      }, {
        $set: {
          status: 'cancelled'
        }
      });

      if (transaction.meta && transaction.meta.redirectCancelUrl) {
        return res.redirect(transaction.meta.redirectCancelUrl);
      }
    }

    res.locals.callback = {
      ok: true
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.hook = async (req, res, next) => {
  try {
    // in dev env, use this https://webhook.site/0c601e24-0e06-4b0d-8173-b510f2c0e8d1
    // TODO - change me
    // https://github.com/paypal/PayPal-REST-API-issues/issues/99
    // subscribe for PAYMENT.SALE.COMPLETED only
    // https://github.com/paypal/PayPal-REST-API-issues/issues/228
    // There's an issue with sandbox webhooks. It's sort of on and off at this time. We are pushing to get it fixed
    // but it should not happen in production environment.
    // Webhooks is recommended for REST API. I don't have info on IPN configuration.
    // https://stackoverflow.com/questions/26351367/paypal-rest-api-billing-agreements-webhooks
    // I can confirm that when a recurring payment is executed, one is notified via webhook event PAYMENT.SALE.COMPLETED
    // as described here: https://github.com/paypal/PayPal-Python-SDK/issues/132#issuecomment-261374087
    // JSON structure of the webhook event:
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
    // TODO - validate me
    if (!req.body.event_type || !req.body.resource) {
      return res.status(400).send();
    }

    // await Payment.updatePaypalTransaction(req.body);
    // res.locals.hook = {
    //   ok: true
    // };
    return next();
  } catch (e) {
    return next();
  }
};
