const statsController = require('../controllers/stats.controller');

module.exports = (router) => {
  /**
   * @apiGroup Statistic
   * @apiVersion 1.0.0
   * @api {get} /v1/shops/stats Shop statistic
   * @apiDescription Get stats for shop
   * @apiUse authRequest
   * @apiPermission admin
   * @apiSuccessExample {json} Response-Success:
   * {
   *    "code": 200,
   *     "message": "OK",
   *     "data": {
   *        "verified": 5,
   *        "unverified": 0,
   *        "activated": 0,
   *        "deactivated": 0,
   *        "featured": 0,
   *        "all": 5
   *    },
   *    "error": false
   * }
   */
  router.get(
    '/v1/shops/stats',
    Middleware.hasRole('admin'),
    statsController.stats,
    Middleware.Response.success('stats')
  );
};
