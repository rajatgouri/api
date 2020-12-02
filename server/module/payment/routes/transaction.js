const transactionController = require('../controllers/transaction.controller');

module.exports = (router) => {
  /**
   * @apiDefine transactionRequest
   * @apiParam {String}   service `order` or `shop_featured`
   * @apiParam {String}   itemId
   * @apiParam {String}   gateway `paypal`, `stripe`
   * @apiParam {String}   [redirectSuccessUrl]
   * @apiParam {String}   [redirectCancelUrl]
   * @apiParam {String}   [stripeToken] required if gateway is `stripe`
   */

  /**
   * @apiGroup Payment
   * @apiVersion 1.0.0
   * @apiName Create transaction
   * @api {post} /v1/payment/transactions/request  Create transacation
   * @apiDescription create transaction and get redirect url
   * @apiUse transactionRequest
   * @apiPermission user
   */
  router.post(
    '/v1/payment/transactions/request',
    Middleware.loadUser,
    transactionController.request,
    Middleware.Response.success('request')
  );

  /**
   * @apiGroup Donation
   * @apiVersion 1.0.0
   * @apiName Create transaction
   * @api {post} /v1/payment/transactions/donation  Create  Donation
   * @apiDescription create transaction and get redirect url
   * @apiUse transactionDonate
   * @apiPermission user
   */
  router.post(
    '/v1/payment/transactions/donate',
    Middleware.loadUser,
    transactionController.donate,
    Middleware.Response.success('request')
  );


  /**
   * @apiGroup Payment
   * @apiVersion 1.0.0
   * @api {get} /v1/payment/braintree/token  Get client token for Braintree
   * @apiDescription Generate token for brainree https://developers.braintreepayments.com/reference/request/client-token/generate/node
   * @apiPermission user
   */
  router.get(
    '/v1/payment/braintree/token',
    Middleware.loadUser,
    transactionController.getBraintreeToken,
    Middleware.Response.success('token')
  );
};
