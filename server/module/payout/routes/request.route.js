const requestController = require('../controllers/request.controller');

module.exports = (router) => {
  /**
   * @apiGroup Request_Payout
   * @apiVersion 1.0.0
   * @apiName Send request
   * @api {post} /v1/payout/request
   * @apiParam {String}   payoutAccountId
   * @apiPermission seller
   */
  router.post(
    '/v1/payout/request',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    requestController.request,
    Middleware.Response.success('request')
  );

  /**
   * @apiGroup Request_Payout
   * @apiVersion 1.0.0
   * @apiName Reject
   * @api {post} /v1/payout/request/:requestId/reject
   * @apiParam {String}   requestId
   * @apiParam {String}   rejectReason Reason why reject this request from admin
   * @apiParam {String}   [note] Custom any note to request
   * @apiPermission admin
   */
  router.post(
    '/v1/payout/request/:requestId/reject',
    Middleware.hasRole('admin'),
    requestController.reject,
    Middleware.Response.success('reject')
  );

  /**
   * @apiGroup Request_Payout
   * @apiVersion 1.0.0
   * @apiName Approve
   * @api {post} /v1/payout/request/:requestId/approve
   * @apiParam {String}   requestId
   * @apiParam {String}   [note] Custom any note to request
   * @apiPermission admin
   */
  router.post(
    '/v1/payout/request/:requestId/approve',
    Middleware.hasRole('admin'),
    requestController.approve,
    Middleware.Response.success('approve')
  );

  /**
   * @apiGroup Request_Payout
   * @apiVersion 1.0.0
   * @apiName Get list
   * @api {get} /v1/payout/requests?:type&:shopId&:status&:code
   * @apiUse paginationQuery
   * @apiParam {String} [type] `paypal` or `bank-account`
   * @apiParam {String} [status] Allow empty, `approved` or `rejected`
   * @apiParam {String} [shopId] The shop, allow for admin account only
   * @apiParam {String} [code] search text for code
   * @apiPermission seller
   */
  router.get(
    '/v1/payout/requests',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    requestController.list,
    Middleware.Response.success('list')
  );

  /**
   * @apiGroup Request_Payout
   * @apiVersion 1.0.0
   * @apiName Find one
   * @api {get} /v1/payout/requests/:requestId
   * @apiParam {String} requestId
   * @apiPermission seller
   */
  router.get(
    '/v1/payout/requests/:requestId',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    requestController.findOne,
    Middleware.Response.success('payoutRequest')
  );

  /**
   * @apiGroup Request_Payout for stripe
   * @apiVersion 1.0.0
   * @apiName Approve
   * @api {post} /v1/payout/request/:requestId/approve
   * @apiParam {String}   requestId
   * @apiParam {String}   [note] Custom any note to request
   * @apiPermission admin
   */
  router.post(
    '/v1/payout/do_payout',
    Middleware.hasRole('admin'),
    requestController.do_payout,
    Middleware.Response.success('result')
  );
};
