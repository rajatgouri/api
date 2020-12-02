const cartController = require('../controllers/cart.controller');

module.exports = (router) => {
  /**
   * @apiGroup Cart
   * @apiVersion 1.0.0
   * @api {post} /v1/cart/calculate  Calculate
   * @apiDescription Calculate and get info of products in cart
   * @apiParam {Object[]}   products products for the orders
   * @apiParam {String}   products.productId product id
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
   * @apiPermission user
   */
  router.post(
    '/v1/cart/calculate',
    cartController.calculate,
    Middleware.Response.success('calculate')
  );
};
