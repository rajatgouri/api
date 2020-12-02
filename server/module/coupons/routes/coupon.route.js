const couponController = require('../controllers/coupon.controller');

module.exports = (router) => {
  /**
   * @apiDefine couponRequest
   * @apiParam {String}   name
   * @apiParam {String}   code
   * @apiParam {Number}   discountPercentage 1 - 100
   * @apiParam {Number}   [limit] how many times the coupon can be used. `0` means unlimited
   * @apiParam {Date} [expiredTime] Expired time fo this coupon
   */

  /**
   * @apiGroup Coupon
   * @apiVersion 1.0.0
   * @apiName Create
   * @api {post} /v1/coupons
   * @apiUse authRequest
   * @apiUse couponRequest
   * @apiPermission seller
   */
  router.post(
    '/v1/coupons',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    couponController.create,
    Middleware.Response.success('coupon')
  );

  /**
   * @apiGroup Coupon
   * @apiVersion 1.0.0
   * @apiName Update
   * @api {put} /v1/coupons/:couponId
   * @apiUse authRequest
   * @apiParam {String}   couponId
   * @apiUse couponRequest
   * @apiPermission seller
   */
  router.put(
    '/v1/coupons/:couponId',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    couponController.findOne,
    couponController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup Coupon
   * @apiVersion 1.0.0
   * @apiName Delete
   * @api {delete} /v1/coupons/:couponId
   * @apiDescription Remove a post
   * @apiUse couponRequest
   * @apiParam {String}   couponId
   * @apiPermission seller
   */
  router.delete(
    '/v1/coupons/:couponId',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    couponController.findOne,
    couponController.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup Coupon
   * @apiVersion 1.0.0
   * @apiName Listing
   * @api {get} /v1/coupons?:q
   * @apiDescription Get list coupons
   * @apiParam {String}   [q]      search keywords
   * @apiPermission seller
   */
  router.get(
    '/v1/coupons',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    couponController.list,
    Middleware.Response.success('list')
  );

  /**
   * @apiGroup Coupon
   * @apiVersion 1.0.0
   * @apiName Check by code
   * @api {post} /v1/coupons/check
   * @apiDescription Get vailable by code. and return discount percentage if have
   * @apiParam {String} code
   * @apiParam {String} shopId
   * @apiPermission seller
   */
  router.post(
    '/v1/coupons/check',
    couponController.check,
    Middleware.Response.success('check')
  );

  /**
   * @apiGroup Coupon
   * @apiVersion 1.0.0
   * @apiName Find One
   * @api {get} /v1/coupons/check
   * @apiParam {String}   id  / coupon id
   * @apiDescription Get coupon detail
   * @apiPermission seller or admin
   */
  router.get(
    '/v1/coupons/:couponId',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    couponController.findOne,
    Middleware.Response.success('coupon')
  );
};
