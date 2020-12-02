const connectController = require('../controllers/connect.controller');

module.exports = (router) => {
  /**
   * @apiGroup Connect Social
   * @apiVersion 1.0.0
   * @api {post} /v1/connect/facebook Facebook
   * @apiUse authRequest
   * @apiParam {String} accessToken Facebook access token
   *
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "success": true
   *    },
   *    "error": false
   * }
   * @apiPermission user
   */
  router.post(
    '/v1/connect/facebook',
    Middleware.isAuthenticated,
    connectController.connectFacebook,
    Middleware.Response.success('connect')
  );

  /**
   * @apiGroup Connect Social
   * @apiVersion 1.0.0
   * @api {post} /v1/connect/google Google
   * @apiUse authRequest
   * @apiParam {String} accessToken Google plus access token
   *
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "success": true
   *    },
   *    "error": false
   * }
   * @apiPermission user
   */
  router.post(
    '/v1/connect/google',
    Middleware.isAuthenticated,
    connectController.connectGoogle,
    Middleware.Response.success('connect')
  );

  /**
   * @apiGroup Connect Social
   * @apiVersion 1.0.0
   * @api {get} /v1/connect/twitter?access_token&redirectUrl Twitter
   * @apiDescription connect with Twitter account, must provide access token for authentication
   *
   * @apiParam {String} access_token jwt token when login
   * @apiParam {String} redirectUrl redirectUrl after connected
   * @apiPermission user
   */
  router.get(
    '/v1/connect/twitter',
    Middleware.isAuthenticated,
    connectController.connectTwitter,
    Middleware.Response.success('connect')
  );

  /**
   * @apiGroup Connect Social
   * @apiVersion 1.0.0
   * @api {get} /v1/connect/twitter Twitter
   * @apiDescription connect with Twitter account, must provide access token for authentication
   *
   * @apiPermission user
   */
  router.get(
    '/v1/connect/twitter/callback',
    connectController.connectTwitterCallback,
    Middleware.Response.success('connect')
  );
};
