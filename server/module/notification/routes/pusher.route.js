const pusherController = require('../controllers/pusher.controller');

module.exports = (router) => {
  /**
   * @apiGroup Pusher
   * @apiVersion 1.0.0
   * @api {post} /v1/pusher/auth Authenticate
   * @apiDescription Authenticate for presence or private chanel https://pusher.com/docs/authenticating_users
   * @apiUse authRequest
   * @apiParam {String} socket_id
   * @apiParam {String} channel_name
   *
   * @apiPermission user
   */
  router.post(
    '/v1/pusher/auth',
    Middleware.isAuthenticated,
    pusherController.auth
  );
};
