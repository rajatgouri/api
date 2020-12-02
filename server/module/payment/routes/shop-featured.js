const shopFeaturedPackageController = require('../controllers/shop-featured-package.controller');

module.exports = (router) => {
  /**
   * @apiDefine shopFeaturedRequest
   * @apiParam {String}   name
   * @apiParam {String}   description
   * @apiParam {Number}   price
   * @apiParam {Number}   numDays
   * @apiParam {Number}   ordering
   */

  /**
   * @apiGroup Shop_Featured_Package
   * @apiVersion 1.0.0
   * @apiName Create
   * @api {post} /v1/packages/featured
   * @apiUse authRequest
   * @apiUse shopFeaturedRequest
   * @apiPermission admin
   */
  router.post(
    '/v1/packages/featured',
    Middleware.hasRole('admin'),
    shopFeaturedPackageController.create,
    Middleware.Response.success('shopFeaturedPackage')
  );

  /**
   * @apiGroup Shop_Featured_Package
   * @apiVersion 1.0.0
   * @apiName Update
   * @api {put} /v1/packages/featured/:shopFeaturedPackageId
   * @apiUse authRequest
   * @apiParam {String}   shopFeaturedPackageId
   * @apiUse shopFeaturedRequest
   * @apiPermission admin
   */
  router.put(
    '/v1/packages/featured/:shopFeaturedPackageId',
    Middleware.hasRole('admin'),
    shopFeaturedPackageController.findOne,
    shopFeaturedPackageController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup Shop_Featured_Package
   * @apiVersion 1.0.0
   * @apiName Delete
   * @api {delete} /v1/packages/featured/:shopFeaturedPackageId
   * @apiDescription Remove a post
   * @apiUse shopFeaturedRequest
   * @apiParam {String}   shopFeaturedPackageId
   * @apiPermission admin
   */
  router.delete(
    '/v1/packages/featured/:shopFeaturedPackageId',
    Middleware.hasRole('admin'),
    shopFeaturedPackageController.findOne,
    shopFeaturedPackageController.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup Shop_Featured_Package
   * @apiVersion 1.0.0
   * @apiName Listing
   * @api {get} /v1/packages/featured?:q
   * @apiDescription Get list packages/featured
   * @apiParam {String}   [q]      search keywords
   * @apiPermission admin
   */
  router.get(
    '/v1/packages/featured',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    shopFeaturedPackageController.list,
    Middleware.Response.success('list')
  );

  /**
   * @apiGroup Shop_Featured_Package
   * @apiVersion 1.0.0
   * @apiName FindOne
   * @api {get} /v1/packages/featured/:shopFeaturedPackageId
   * @apiDescription Find one a package
   * @apiUse shopFeaturedRequest
   * @apiParam {String}   shopFeaturedPackageId
   * @apiPermission admin or seller
   */
  router.get(
    '/v1/packages/featured/:shopFeaturedPackageId',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    shopFeaturedPackageController.findOne,
    Middleware.Response.success('shopFeaturedPackage')
  );
};
