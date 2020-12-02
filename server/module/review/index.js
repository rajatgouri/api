const reviewController = require('./controllers/review.controller');

exports.model = {
  Review: require('./models/review')
};

exports.mongoosePlugin = require('./mongoosePlugin');

exports.services = {
  Review: require('./services/Review')
};

exports.router = (router) => {
  /**
   * @apiGroup Review
   * @apiVersion 1.0.0
   * @api {get} /v1/reviews?:productId&:rateBy&:shopId&:type  Get list categories
   * @apiDescription Get list categories
   * @apiParam {String}   [productId] review for products
   * @apiParam {String}   [rateBy] who reviewed
   * @apiParam {String}   [shopId] shop
   * @apiParam {String}   [type] `product` or `shop`
   * @apiPermission all
   */
  router.get(
    '/v1/reviews',
    reviewController.list,
    Middleware.Response.success('list')
  );

  /**
   * @apiGroup Review
   * @apiVersion 1.0.0
   * @api {post} /v1/reviews  Create new review
   * @apiDescription Create new review
   * @apiUse authRequest
   * @apiParam {String}   [productId] product id. Required if type is `product`
   * @apiParam {String}   [shopId] shop id. Required if type is `shop`
   * @apiParam {String}   rating Score for rate. from 1-5
   * @apiParam {String}   comment
   * @apiParam {String}   [type] `product` or `shop`. Default is product
   * @apiPermission user
   */
  router.post(
    '/v1/reviews',
    Middleware.isAuthenticated,
    reviewController.create,
    Middleware.Response.success('review')
  );

  /**
   * @apiGroup Review
   * @apiVersion 1.0.0
   * @api {put} /v1/reviews/:reviewId  Update a review
   * @apiDescription Update a review
   * @apiUse authRequest
   * @apiParam {String}   reviewId        Review id
   * @apiParam {String}   rating Score for rate. from 1-5
   * @apiParam {String}   comment
   * @apiPermission user
   */
  router.put(
    '/v1/reviews/:reviewId',
    Middleware.isAuthenticated,
    reviewController.findOne,
    reviewController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup Review
   * @apiVersion 1.0.0
   * @api {delete} /v1/reviews/:reviewId Remove a review
   * @apiDescription Remove a review
   * @apiUse authRequest
   * @apiParam {String}   reviewId        Review id
   * @apiPermission user
   */
  router.delete(
    '/v1/reviews/:reviewId',
    Middleware.isAuthenticated,
    reviewController.findOne,
    reviewController.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup Review
   * @apiVersion 1.0.0
   * @api {get} /v1/reviews/:reviewId Get review details
   * @apiDescription Get review details
   * @apiParam {String}   reviewId        Review id
   * @apiPermission all
   */
  router.get(
    '/v1/reviews/:reviewId',
    reviewController.findOne,
    Middleware.Response.success('review')
  );

  /**
   * @apiGroup Review
   * @apiVersion 1.0.0
   * @api {post} /v1/reviews/canReview Check if review is allowable
   * @apiDescription Check if review is allowable
   * @apiParam {String}   [productId] product id. Required if type is `product`
   * @apiParam {String}   [shopId] shop id. Required if type is `shop`
   * @apiParam {String}   [type] `product` or `shop`. Default is product
   * @apiSuccessExample {json} Success-Response:
   * { "canReview": true }
   * @apiPermission user
   */
  router.post(
    '/v1/reviews/canReview',
    Middleware.loadUser,
    reviewController.canReview,
    Middleware.Response.success('canReview')
  );

  /**
   * @apiGroup Review
   * @apiVersion 1.0.0
   * @api {get} /v1/reviews/:type/:itemId/current Get my current review
   * @apiDescription Get review of current item
   * @apiParam {String}   type `product` or `shop`
   * @apiParam {String}   itemId Shop id or product id
   * @apiPermission user
   */
  router.get(
    '/v1/reviews/:type/:itemId/current',
    Middleware.isAuthenticated,
    reviewController.getMyCurrentReview,
    Middleware.Response.success('review')
  );
};
