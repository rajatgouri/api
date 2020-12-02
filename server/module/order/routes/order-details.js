const orderDetailsController = require('../controllers/order-details.controller');

module.exports = (router) => {
  /**
   * @apiGroup Shop Order
   * @apiVersion 1.0.0
   * @api {get} /v1/orders/shops?:status&:sort&:sortType&:page&:take&startDate&toDate&paymentMethod  Get list orders for shop
   * @apiDescription Get list orders of shop. it is order details
   * @apiParam {String}   [startDate] start time in UTC format
   * @apiParam {String}   [toDate] to time in UTC format
   * @apiUse authRequest
   * @apiPermission seller
   */
  router.get(
    '/v1/orders/shops',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    orderDetailsController.list,
    Middleware.Response.success('list')
  );

  /**
   * @apiGroup Shop Order
   * @apiVersion 1.0.0
   * @api {get} /v1/orders/details/:orderDetailId  Get details of the sub order
   * @apiDescription Get details of the sub order which managed by shop
   * @apiUse authRequest
   * @apiPermission seller
   */
  router.get(
    '/v1/orders/details/:orderDetailId',
    Middleware.isAuthenticated,
    orderDetailsController.details,
    Middleware.Response.success('details')
  );

  /**
   * @apiGroup Shop Order
   * @apiVersion 1.0.0
   * @api {put} /v1/orders/details/:orderDetailId/status Update shop order status
   * @apiDescription Update shop order status
   * @apiParam {String}   status `pending`, `progressing`, `shipping`, `completed`, `refunded`, `cancelled`
   * @apiUse authRequest
   * @apiPermission seller
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "success": true
   *     },
   *     "error": false
   *  }
   */
  router.put(
    '/v1/orders/details/:orderDetailId/status',
    Middleware.isAuthenticated,
    orderDetailsController.details,
    orderDetailsController.updateStatus,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup Shop Order
   * @apiVersion 1.0.0
   * @apiName Update shipping info
   * @api {put} /v1/orders/details/:orderDetailId/shipping
   * @apiDescription Update shop order shipping info
   * @apiParam {String}   shippingMethod Like UPS
   * @apiParam {String}   shippingCode The shipping code of shipping method
   * @apiUse authRequest
   * @apiPermission seller
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "success": true
   *     },
   *     "error": false
   *  }
   */
  router.put(
    '/v1/orders/details/:orderDetailId/shipping',
    Middleware.isAuthenticated,
    orderDetailsController.details,
    orderDetailsController.updateShippingInfo,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup Shop Order
   * @apiVersion 1.0.0
   * @apiName Do download fie
   * @api {get} /v1/orders/details/:orderDetailId/digitals/download
   * @apiUse authRequest
   * @apiPermission seller
   */
  router.get(
    '/v1/orders/details/:orderDetailId/digitals/download',
    orderDetailsController.downloadDigitalFile
  );

  /**
   * @apiGroup Shop Order
   * @apiVersion 1.0.0
   * @apiName Get download link
   * @api {get} /v1/orders/details/:orderDetailId/digitals/download/link
   * @apiDescription Get details of the sub order which managed by shop
   * @apiUse authRequest
   * @apiPermission user
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "success": true,
   *         "message": "An email with download link has been sent to your email"
   *     },
   *     "error": false
   *  }
   */
  router.get(
    '/v1/orders/details/:orderDetailId/digitals/download/link',
    Middleware.isAuthenticated,
    orderDetailsController.details,
    orderDetailsController.getDownloadDigitalLink,
    Middleware.Response.success('link')
  );

  /**
   * @apiGroup Shop Order
   * @apiVersion 1.0.0
   * @apiName Get download invoice
   * @api {get} /v1/orders/details/:orderDetailId/download/invoice
   * @apiDescription Download invoice content. Add access_token to query string
   * @apiUse authRequest
   * @apiPermission user
   */
  router.get(
    '/v1/orders/details/:orderDetailId/download/invoice',
    Middleware.isAuthenticated,
    orderDetailsController.downloadInvoice
  );
};
