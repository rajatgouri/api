const statsController = require('../controllers/stats.controller');

module.exports = (router) => {
  /**
   * @apiGroup Request_Payout
   * @apiVersion 1.0.0
   * @apiName Get balance
   * @apiDescription Get current balance of current shop
   * @api {get} /v1/payout/balance
   * @apiPermission seller
   */
  router.get(
    '/v1/payout/balance',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    statsController.balance,
    Middleware.Response.success('balance')
  );

  /**
   * @apiGroup Request_Payout
   * @apiVersion 1.0.0
   * @apiName Get balance by shop
   * @apiDescription Get current balance of shop
   * @api {get} /v1/payout/balance/:shopId
   * @apiPermission admin
   */
  router.get(
    '/v1/payout/balance/:shopId',
    Middleware.hasRole('admin'),
    statsController.balance,
    Middleware.Response.success('balance')
  );

  /**
   * @apiGroup Request_Payout
   * @apiVersion 1.0.0
   * @apiName Stats current shop
   * @apiDescription Get statistic for the current shop
   * @api {get} /v1/payout/stats?:shopId&:startDate&:toDate
   * @apiParam {String} [shopId] allow shop if admin
   * @apiParam {Date} [startDate] UTC time format
   * @apiParam {Date} [toDate] UTC time format
   * @apiPermission seller
   */
  router.get(
    '/v1/payout/stats',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    statsController.stats,
    Middleware.Response.success('stats')
  );
};
