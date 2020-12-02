const orderController = require('../controllers/order.controller');

module.exports = (router) => {
  /**
   * @apiGroup Order
   * @apiVersion 1.0.0
   * @apiName Create new order
   * @api {post} /v1/orders
   * @apiDescription Check out for order. Allow for guest
   * @apiUse authRequest
   * @apiParam {Object[]}   products products for the orders
   * @apiParam {String}   products.productId product id
   * @apiParam {Number}   products.quantity product quantity. default is 1
   * @apiParam {String}   [products.userNote] custom note for this product
   * @apiParam {String}   [products.productVariantId] product variant if have
   * @apiParam {String}   [products.couponCode] Coupon code if have
   * @apiParam {String}   paymentMethod Payment type. Just allow `cod` for now
   * @apiParam {String}   [shippingMethod] Shipping type
   * @apiParam {String}   [shippingAddress] required for `cod` method
   * @apiParam {String}   [phoneNumber]
   * @apiParam {String}   [email]
   * @apiParam {String}   [firstName]
   * @apiParam {String}   [lastName]
   * @apiParam {String}   [streetAddress]
   * @apiParam {String}   [city]
   * @apiParam {String}   [state]
   * @apiParam {String}   [country]
   * @apiParam {String}   [zipCode]
   * @apiParam {String}   [userCurrency] Currency of user, which query in the system config
   * @apiPermission all
   */
  router.post(
    '/v1/orders',
    Middleware.loadUser,
    orderController.create,
    Middleware.Response.success('order')
  );

  /**
   * @apiGroup Order
   * @apiVersion 1.0.0
   * @api {get} /v1/orders?:status&:sort&:sortType&:page&:take  Get list orders
   * @apiDescription Get list orders of current customer. Or all if admin
   * @apiUse authRequest
   * @apiPermission user
   */
  router.get(
    '/v1/orders',
    Middleware.isAuthenticated,
    orderController.list,
    Middleware.Response.success('list')
  );

  /**
   * @apiGroup Order
   * @apiVersion 1.0.0
   * @api {get} /v1/orders/:orderid Get details of the order
   * @apiDescription Get details of the order
   * @apiUse authRequest
   * @apiPermission user
   */
  router.get(
    '/v1/orders/:orderId',
    Middleware.isAuthenticated,
    orderController.details,
    Middleware.Response.success('order')
  );

  /**
   * @apiGroup Order
   * @apiVersion 1.0.0
   * @api {get} /v1/orders/get-user-last-order Get last order of user
   * @apiDescription Get details of the last order for user
   * @apiUse authRequest
   * @apiPermission user
   */
  router.post(
    '/v1/orders/get-user-last-order',
    Middleware.isAuthenticated,
    orderController.getUserLastOrderDetails,
    Middleware.Response.success('order')
  );
};
