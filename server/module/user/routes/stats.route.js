const statsController = require('../controllers/stats.controller');

module.exports = (router) => {
  /**
   * @apiGroup Statistic
   * @apiVersion 1.0.0
   * @api {get} /v1/users/stats User statistic
   * @apiDescription Get stats for user
   * @apiUse authRequest
   * @apiPermission admin
   * @apiSuccessExample {json} Response-Success:
   * {
   *    "code": 200,
   *     "message": "OK",
   *     "data": {
   *        "activated": 2,
   *        "deactivated": 1,
   *        "all": 3
   *    },
   *    "error": false
   * }
   */
  router.get(
    '/v1/users/stats',
    Middleware.hasRole('admin'),
    statsController.stats,
    Middleware.Response.success('stats')
  );
};
