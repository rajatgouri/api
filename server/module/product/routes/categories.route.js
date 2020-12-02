const categoryController = require('../controllers/category.controller');

module.exports = (router) => {
  /**
   * @apiDefine productatCegoryRequest
   * @apiParam {String}   name        Brand name
   * @apiParam {String}   [alias]     Alias name. Or will be generated from name automatically
   * @apiParam {String}   [description]
   * @apiParam {Number}   [ordering]
   * @apiParam {String}   [parentId]
   * @apiParam {String}   [mainImage]
   * @apiParam {String[]}   [specifications] array of string specifications
   * @apiParam {String[]}   [chemicalIdentifiers] array of string chemical identifiers
   * @apiParam {Object}   [metaSeo] `{keywords, description}`
   */

  /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {get} /v1/products/categories?:name&:alias  Get list category
   * @apiDescription Get list brands
   * @apiParam {String}   [name]      brand name
   * @apiParam {String}   [alias]     brand alias
   * @apiPermission all
   */
  router.get(
    '/v1/products/categories',
    categoryController.list,
    Middleware.Response.success('productCategoryList')
  );

  /**
   * @apiGroup Product category
   * @apiVersion 1.0.0
   * @api {post} /v1/products/categories  Create new category
   * @apiDescription Create new category
   * @apiUse authRequest
   * @apiUse productatCegoryRequest
   * @apiPermission superadmin
   */
  router.post(
    '/v1/products/categories',
    Middleware.hasRole('admin'),
    categoryController.create,
    Middleware.Response.success('productCategory')
  );

  /**
   * @apiGroup Product category
   * @apiVersion 1.0.0
   * @api {put} /v1/products/categories/:id  Update a category
   * @apiDescription Update a category
   * @apiUse authRequest
   * @apiUse productatCegoryRequest
   * @apiPermission superadmin
   */
  router.put(
    '/v1/products/categories/:id',
    Middleware.hasRole('admin'),
    categoryController.findOne,
    categoryController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup Product category
   * @apiVersion 1.0.0
   * @api {delete} /v1/products/categories/:id Remove a brand
   * @apiDescription Remove a category
   * @apiUse authRequest
   * @apiParam {String}   id        Brand id
   * @apiPermission superadmin
   */
  router.delete(
    '/v1/products/categories/:id',
    Middleware.hasRole('admin'),
    categoryController.findOne,
    categoryController.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup Product category
   * @apiVersion 1.0.0
   * @api {get} /v1/products/categories/tree Get tree
   * @apiDescription Get tree
   * @apiPermission all
   */
  router.get(
    '/v1/products/categories/tree',
    categoryController.tree,
    Middleware.Response.success('tree')
  );

  /**
   * @apiGroup Product category
   * @apiVersion 1.0.0
   * @api {get} /v1/products/categories/:id Get category details
   * @apiDescription Get category details
   * @apiParam {String}   id        category id
   * @apiPermission all
   */
  router.get(
    '/v1/products/categories/:id',
    categoryController.findOne,
    Middleware.Response.success('productCategory')
  );
};
