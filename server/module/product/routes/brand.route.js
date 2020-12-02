const brandController = require('../controllers/brand.controller');

module.exports = (router) => {
  /**
   * @apiDefine brandRequest
   * @apiParam {String}   name        Brand name
   * @apiParam {String}   [alias]     Alias name. Or will be generated from name automatically
   * @apiParam {String}   [description]
   * @apiParam {Number}   [ordering]
   */

  /**
   * @apiGroup Brand
   * @apiVersion 1.0.0
   * @api {get} /v1/brands?:name&:alias  Get list brands
   * @apiDescription Get list brands
   * @apiParam {String}   [name]      brand name
   * @apiParam {String}   [alias]     brand alias
   * @apiPermission all
   */
  router.get(
    '/v1/brands',
    brandController.list,
    Middleware.Response.success('brandList')
  );

  /**
   * @apiGroup Brand
   * @apiVersion 1.0.0
   * @api {post} /v1/brands  Create new brand
   * @apiDescription Create new brand
   * @apiUse authRequest
   * @apiUse brandRequest
   * @apiPermission superadmin
   */
  router.post(
    '/v1/brands',
    Middleware.hasRole('admin'),
    brandController.create,
    Middleware.Response.success('brand')
  );

  /**
   * @apiGroup Brand
   * @apiVersion 1.0.0
   * @api {put} /v1/brands/:id  Update a brand
   * @apiDescription Update a brand
   * @apiUse authRequest
   * @apiUse brandRequest
   * @apiPermission superadmin
   */
  router.put(
    '/v1/brands/:id',
    Middleware.hasRole('admin'),
    brandController.findOne,
    brandController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup Brand
   * @apiVersion 1.0.0
   * @api {delete} /v1/brands/:id Remove a brand
   * @apiDescription Remove a brand
   * @apiUse authRequest
   * @apiParam {String}   id        Brand id
   * @apiPermission superadmin
   */
  router.delete(
    '/v1/brands/:id',
    Middleware.hasRole('admin'),
    brandController.findOne,
    brandController.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup Brand
   * @apiVersion 1.0.0
   * @api {get} /v1/brands/:id Get brand details
   * @apiDescription Get brand details
   * @apiParam {String}   id        Brand id
   * @apiPermission all
   */
  router.get(
    '/v1/brands/:id',
    brandController.findOne,
    Middleware.Response.success('brand')
  );
};
