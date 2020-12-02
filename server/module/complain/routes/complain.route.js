const complainController = require('../controllers/complain.controller');

module.exports = (router) => {
  /**
   * @apiGroup Complain
   * @apiVersion 1.0.0
   * @api {post} /v1/complains  Create new Complain
   * @apiDescription Create new Complain
   * @apiUse authRequest
   * @apiParam {String}   content
   * @apiPermission user
   */
  router.post(
    '/v1/complains',
    Middleware.isAuthenticated,
    complainController.create,
    Middleware.Response.success('create')
  );

  /**
   * @apiGroup Complain
   * @apiVersion 1.0.0
   * @api {get} /v1/complains?:status&:sort&:sortType&:page&:take  Get list complains
   * @apiDescription Get list complains of current customer. Or all if admin
   * @apiUse authRequest
   * @apiPermission user
   */
  router.get(
    '/v1/complains',
    Middleware.isAuthenticated,
    complainController.list,
    Middleware.Response.success('list')
  );

  /**
   * @apiGroup Complain
   * @apiVersion 1.0.0
   * @api {get} /v1/complains/:complainId Get details of the Complain
   * @apiDescription Get details of the Complain
   * @apiUse authRequest
   * @apiPermission user
   */
  router.get(
    '/v1/complains/:complainId',
    Middleware.isAuthenticated,
    complainController.findOne,
    Middleware.Response.success('complain')
  );

  /**
   * @apiGroup Complain
   * @apiVersion 1.0.0
   * @api {put} /v1/complains/:complainId Update complain
   * @apiDescription Update complain
   * @apiUse authRequest
   * @apiParam {String}   [content]
   * @apiParam {String}   [note]
   * @apiParam {String}   [status] `pending`, `resolved`, 'rejected
   * @apiPermission admin
   */
  router.put(
    '/v1/complains/:complainId',
    Middleware.hasRole('admin'),
    complainController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup Complain
   * @apiVersion 1.0.0
   * @api {delete} /v1/complains/:complainId Remove complain
   * @apiDescription Remove complain
   * @apiUse authRequest
   * @apiParam {String}   complainId
   * @apiPermission admin
   */
  router.delete(
    '/v1/complains/:complainId',
    Middleware.hasRole('admin'),
    complainController.remove,
    Middleware.Response.success('remove')
  );
};
