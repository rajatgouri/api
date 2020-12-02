const variantController = require('../controllers/variant.controller');

module.exports = (router) => {
  /**
   * @apiDefine productVariantRequest
   * @apiParam {String}   productId  Product id
   * @apiParam {Number}   price
   * @apiParam {Number}   [salePrice]
   * @apiParam {Number}   stockQuantity stock quantity for this variants
   * @apiParam {String}   [digitalFileId] Media id for digital file
   * @apiParam {Object[]}   [specifications] `[{key, value}]`
   * @apiParam {String}   [specifications.key] special keys
   * @apiParam {String}   [specifications.value] special value
   * @apiParam {Object[]}   [options] `[{key, value, displayText}]`
   * @apiParam {String}   [options.optionKey] Option key from API get options. add `_custom` for custom attributes
   * @apiParam {String}   [options.key] Key of option
   * @apiParam {String}   [options.value] any value
   * @apiParam {String}   [options.displayText] Text from options field or custom text
   */

  /**
   * @apiGroup Product variant
   * @apiVersion 1.0.0
   * @api {get} /v1/products/:productId/variants?page&take&sort&sortType  Get list variants of the product
   * @apiDescription Get list variants of the product
   * @apiParam {productId}   product uuid
   * @apiPermission all
   */
  router.get(
    '/v1/products/:productId/variants',
    Middleware.loadUser,
    variantController.list,
    Middleware.Response.success('productVariantList')
  );

  /**
   * @apiGroup Product variant
   * @apiVersion 1.0.0
   * @api {post} /v1/products/variants  Create new variant
   * @apiDescription Create new variant
   * @apiParam {productId}   product uuid
   * @apiUse authRequest
   * @apiUse productVariantRequest
   * @apiPermission seller
   */
  router.post(
    '/v1/products/:productId/variants',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    variantController.create,
    Middleware.Response.success('productVariant')
  );

  /**
   * @apiGroup Product variant
   * @apiVersion 1.0.0
   * @api {put} /v1/products/:productId/variants/:id  Update a variant
   * @apiDescription Update a variant
   * @apiUse authRequest
   * @apiParam {productId}   product uuid
   * @apiUse productVariantRequest
   * @apiPermission superadmin
   */
  router.put(
    '/v1/products/:productId/variants/:productVariantId',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    variantController.findOne,
    variantController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup Product variant
   * @apiVersion 1.0.0
   * @api {delete} /v1/products/:productId/variants/:productVariantId Remove a variant
   * @apiDescription Remove a variant
   * @apiUse authRequest
   * @apiParam {String}   productVariantId variant id
   * @apiParam {productId}   product uuid
   * @apiPermission superadmin
   */
  router.delete(
    '/v1/products/:productId/variants/:productVariantId',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    variantController.findOne,
    variantController.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup Product variant
   * @apiVersion 1.0.0
   * @api {get} /v1/products/:productId/variants/:id Get variant details
   * @apiDescription Get variant details
   * @apiParam {String}   id        Brand id
   * @apiPermission all
   */
  router.get(
    '/v1/products/:productId/variants/:id',
    Middleware.loadUser,
    variantController.findOne,
    Middleware.Response.success('variant')
  );
};
