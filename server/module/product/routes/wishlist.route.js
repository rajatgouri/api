const WishlistController = require('../controllers/wishlist.controller');

module.exports = (router) => {
  /**
   * @apiDefine wishlistRequest
   * @apiParam {String}   productId product uuid
   */

  /**
   * @apiGroup Wishlist
   * @apiVersion 1.0.0
   * @api {get} /v1/wishlist?:sort&:sortType&:page&:take  Get list wishlist
   * @apiDescription Get list wishlist of current user
   * @apiPermission user
   */
  router.get(
    '/v1/wishlist',
    Middleware.isAuthenticated,
    WishlistController.list,
    Middleware.Response.success('list')
  );

  /**
   * @apiGroup Wishlist
   * @apiVersion 1.0.0
   * @api {post} /v1/wishlist  Create new wishlist
   * @apiDescription Create new wishlist.
   * @apiUse authRequest
   * @apiUse wishlistRequest
   * @apiPermission superadmin
   */
  router.post(
    '/v1/wishlist',
    Middleware.isAuthenticated,
    WishlistController.create,
    Middleware.Response.success('wishlist')
  );

  /**
   * @apiGroup Wishlist
   * @apiVersion 1.0.0
   * @api {delete} /v1/wishlist/:id Remove a wishlist
   * @apiDescription Remove a wishlist
   * @apiUse authRequest
   * @apiParam {String}   id        Wishlist id
   * @apiPermission superadmin
   */
  router.delete(
    '/v1/wishlist/:wishlistId',
    Middleware.isAuthenticated,
    WishlistController.findOne,
    WishlistController.remove,
    Middleware.Response.success('remove')
  );
};
