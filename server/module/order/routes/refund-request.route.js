const refundRequestController = require('../controllers/refund-request.controller');

module.exports = (router) => {
  /**
   * @apiGroup Refund request
   * @apiVersion 1.0.0
   * @api {get} /v1/refundRequests?:sort&:sortType&:page&:take  Get list refund request
   * @apiDescription Get list refund request
   * @apiUse authRequest
   * @apiSuccessExample {json} Success-Response:
   * {
   *   "code": 200,
   *   "message": "OK",
   *   "data": {
   *     "items": [{ reason: "some text" }],
   *     "count": 1
   *   },
   *   "error": false
   * }
   * @apiPermission seller
   */
  router.get(
    '/v1/refundRequests',
    Middleware.isAuthenticated,
    // Middleware.isAdminOrSeller,
    refundRequestController.list,
    Middleware.Response.success('list')
  );

  /**
   * @apiGroup Refund request
   * @apiVersion 1.0.0
   * @api {get} /v1/refundRequests/:refundRequestId  Get detail
   * @apiDescription Get details of request
   * @apiUse authRequest
   * @apiSuccessExample {json} Success-Response:
   * {
   *   "code": 200,
   *   "message": "OK",
   *   "data": {
   *     "_id": "xxxxxx",
   *     "reason": "some text",
   *     "orderDetail": { "key": "val" },
   *     "shop": { "key": "val" },
   *     "customer": { "key": "val" }
   *   },
   *   "error": false
   * }
   * @apiPermission seller
   */
  router.get(
    '/v1/refundRequests/:refundRequestId',
    Middleware.isAuthenticated,
    refundRequestController.details,
    Middleware.Response.success('details')
  );

  /**
   * @apiGroup Refund request
   * @apiVersion 1.0.0
   * @api {post} /v1/refundRequests Send refund request
   * @apiDescription Send refund request to shop
   * @apiParam {String}   reason
   * @apiParam {String}   orderDetailId
   * @apiSuccessExample {json} Success-Response:
   * {
   *   "code": 200,
   *   "message": "OK",
   *   "data": {
   *     "_id": "xxxxxx",
   *     "reason": "some text"
   *   },
   *   "error": false
   * }
   * @apiUse authRequest
   * @apiPermission user
   */
  router.post(
    '/v1/refundRequests',
    Middleware.isAuthenticated,
    refundRequestController.request,
    Middleware.Response.success('request')
  );



  router.post(
    '/v1/payment/product/refund',
    Middleware.isAuthenticated,
    refundRequestController.createStripeSingleRefund,
    Middleware.Response.success('result')
  );
};
