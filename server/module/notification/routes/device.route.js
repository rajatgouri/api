const deviceController = require('../controllers/device.controller');

module.exports = (router) => {
  /**
   * @apiGroup Devices
   * @apiVersion 1.0.0
   * @api {post} /v1/devices Add device
   * @apiDescription Add mobile device for push notification
   * @apiUse authRequest
   * @apiParam {String} os `ios` or `android`
   * @apiParam {String} identifier device token
   *
   * @apiPermission user
   */
  router.post(
    '/v1/devices',
    Middleware.isAuthenticated,
    deviceController.add,
    Middleware.Response.success('device')
  );
};
