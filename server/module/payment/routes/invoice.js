const invoiceController = require('../controllers/invoice.controller');

module.exports = (router) => {
  /**
   * @apiGroup Payment - Invoice
   * @apiVersion 1.0.0
   * @api {get} /v1/payment/invoices  Get invoices of user
   * @apiDescription  Get invoices of user
   * @apiPermission user
   */
  router.get(
    '/v1/payment/invoices',
    Middleware.isAuthenticated,
    invoiceController.search,
    Middleware.Response.success('search')
  );
};
