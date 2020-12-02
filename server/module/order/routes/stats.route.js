const statsController = require('../controllers/stats.controller');

module.exports = (router) => {
  /**
   * @apiGroup Statistic
   * @apiVersion 1.0.0
   * @api {get} /v1/orders/seller/stats?shopId Order
   * @apiDescription Get stats for order. Allow seller or admin
   * @apiUse authRequest
   * @apiParam {String} [shopId] Allow to filter by shop if admin
   * @apiPermission seller
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "pending": 1,
   *         "progressing": 1,
   *         "shipping": 1,
   *         "completed": 1,
   *         "refunded": 1,
   *         "cancelled": 1,
   *         "all": 1
   *     },
   *     "error": false
   *  }
   */
  router.get(
    '/v1/orders/seller/stats',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    statsController.stats,
    Middleware.Response.success('stats')
  );

  /**
   * @apiGroup Statistic
   * @apiVersion 1.0.0
   * @api {get} /v1/orders/seller/stats/sale?shopId Sale stats
   * @apiDescription Get stats sale. Allow admin or selle
   * @apiUse authRequest
   * @apiParam {String} [shopId] Allow to filter by shop if admin
   * @apiPermission seller
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "balance": 1,
   *         "commission": 1,
   *         "totalPrice": 1,
   *         "taxPrice": 1,
   *         "totalProduct": 1
   *     },
   *     "error": false
   *  }
   */
  router.get(
    '/v1/orders/seller/stats/sale',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    statsController.saleStats,
    Middleware.Response.success('saleStats')
  );
};
