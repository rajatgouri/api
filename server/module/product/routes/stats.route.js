const statsController = require('../controllers/stats.controller');

module.exports = (router) => {
  /**
   * @apiGroup Statistic
   * @apiVersion 1.0.0
   * @api {get} /v1/products/seller/stats Products statistic
   * @apiDescription Get stats for product
   * @apiUse authRequest
   * @apiPermission seller
   */
  router.get(
    '/v1/products/seller/stats',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    statsController.stats,
    Middleware.Response.success('stats')
  );

};


