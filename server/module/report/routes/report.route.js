const reportController = require('../controllers/report.controller.');

module.exports = (router) => {
  /**
   * @apiGroup Report
   * @apiVersion 1.0.0
   * @api {post} /v1/reports  Create new Report
   * @apiDescription Create new Report
   * @apiUse authRequest
   * @apiParam {String}   type
   * @apiParam {String}   content
   * @apiParam {String}   shopId
   * @apiPermission user
   */
  router.post(
    '/v1/reports',
    Middleware.isAuthenticated,
    reportController.create,
    Middleware.Response.success('create')
  );

  /**
   * @apiGroup Report
   * @apiVersion 1.0.0
   * @api {get} /v1/reports?:status&:sort&:sortType&:page&:take  Get list reports
   * @apiDescription Get list reports of current customer. Or all if admin
   * @apiUse authRequest
   * @apiPermission user
   */
  router.get(
    '/v1/reports',
    Middleware.isAuthenticated,
    reportController.list,
    Middleware.Response.success('list')
  );

  /**
   * @apiGroup Report
   * @apiVersion 1.0.0
   * @api {get} /v1/reports/:reportId Get details of the Report
   * @apiDescription Get details of the Report
   * @apiUse authRequest
   * @apiPermission user
   */
  router.get(
    '/v1/reports/:reportId',
    Middleware.isAuthenticated,
    reportController.findOne,
    Middleware.Response.success('report')
  );

  /**
   * @apiGroup Report
   * @apiVersion 1.0.0
   * @api {put} /v1/reports/:reportId Update report
   * @apiDescription Update report
   * @apiUse authRequest
   * @apiParam {String}   [content]
   * @apiParam {String}   [note]
   * @apiParam {String}   [status] `pending`, `resolved`, 'rejected
   * @apiPermission admin
   */
  router.put(
    '/v1/reports/:reportId',
    Middleware.hasRole('admin'),
    reportController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup Report
   * @apiVersion 1.0.0
   * @api {delete} /v1/reports/:reportId Remove report
   * @apiDescription Remove report
   * @apiUse authRequest
   * @apiParam {String}   reportId
   * @apiPermission admin
   */
  router.delete(
    '/v1/reports/:reportId',
    Middleware.hasRole('admin'),
    reportController.remove,
    Middleware.Response.success('remove')
  );
};
