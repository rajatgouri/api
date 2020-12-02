const phoneCheckController = require('../controllers/phone-check.controller');

module.exports = (router) => {
  /**
   * @apiGroup Order
   * @apiVersion 1.0.0
   * @api {post} /v1/orders/phone/check Check phone number valid
   * @apiDescription Check phone number valid
   * @apiParam {String}   phoneNumber
   * @apiUse authRequest
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "success": true
   *     }
   * @apiPermission all
   */
  router.post(
    '/v1/orders/phone/check',
    // allow phone check for guest checkout
    Middleware.loadUser,
    phoneCheckController.check,
    Middleware.Response.success('check')
  );
};
