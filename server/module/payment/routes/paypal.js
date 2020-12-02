const paypalController = require('../controllers/paypal.controller');

module.exports = (router) => {
  /**
   * @apiGroup Payment
   * @apiVersion 1.0.0
   * @api {get} /v1/payment/paypal/callback  Paypal callback return url
   * @apiDescription update transaction base on request
   * @apiPermission all
   */
  router.get(
    '/v1/payment/paypal/callback',
    paypalController.callback,
    Middleware.Response.success('callback')
  );

  /**
   * @apiGroup Payment
   * @apiVersion 1.0.0
   * @api {post} /v1/payment/paypal/hook  Paypal webhook
   * @apiDescription Paypal webhook for sale completed event
   * @apiPermission all
   */
  router.post(
    '/v1/payment/paypal/hook',
    paypalController.hook,
    Middleware.Response.success('hook')
  );
};
