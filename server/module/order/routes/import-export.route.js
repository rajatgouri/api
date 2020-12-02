const importExportController = require('../controllers/import-export.controller');

module.exports = (router) => {
  /**
   * @apiGroup Export_Import
   * @apiVersion 1.0.0
   * @apiName Export shop order to csv
   * @api {get} /v1/orders/shops/export/csv?:status&:sort&:sortType&:page&:take&startDate&toDate&fileName&paymentMethod
   * @apiDescription generate order to csv. Add `access_token` in the query string for authenticated
   * @apiParam {String}   [startDate] start time in UTC format
   * @apiParam {String}   [toDate] to time in UTC format
   * @apiParam {String}   [fileName] File name server will response
   * @apiParam {String}   [paymentMethod] `cod`, `paypal`, `stripe`
   * @apiUse authRequest
   * @apiPermission seller
   */
  router.get(
    '/v1/orders/shops/export/csv',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    importExportController.toCsv
  );
};
