const Joi = require('joi');
const url = require('url');
const nconf = require('nconf');
const Braintree = require('../components/Braintree');

const validateSchema = Joi.object().keys({
  gateway: Joi.string().allow(['paypal', 'stripe', 'braintree']).required(),
  service: Joi.string().allow(['order', 'shop_featured']).required(),
  redirectSuccessUrl: Joi.string().optional(),
  amount: Joi.string().optional(),
  redirectCancelUrl: Joi.string().optional(),
  itemId: Joi.string().required(), // base on type, like order id
  stripeToken: Joi.string().optional(), // stripe token
  // TODO - validate if gateway is Stripe
  braintreeNonce: Joi.string().optional()
});

exports.request = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    const value = validate.value;

    let paymentData;
    if (value.service === 'order') {
      const order = await DB.Order.findOne({ _id: value.itemId }).populate('details');
      if (!order || !order.details || !order.details.length) {
        return next(PopulateResponse.notFound({
          message: 'Order not found!'
        }));
      }

      const price = order.totalPrice;
      // TODO - add currency here
      paymentData = {
        gateway: value.gateway,
        price,
        returnUrl: url.resolve(nconf.get('baseUrl'), '/v1/payment/paypal/callback?action=success'),
        cancelUrl: url.resolve(nconf.get('baseUrl'), '/v1/payment/paypal/callback?action=cancel'),
        meta: value,
        userId: order.customerId || null,
        type: 'order',
        description: `Order #${order.trackingCode}`,
        products: order.details.map(detail => ({
          id: detail.trackingCode,
          price: detail.totalPrice,
          description: detail.productDetails.name
        })),
        itemId: order._id,
        stripeToken: value.stripeToken
      };
    } else {
      if (!req.user) {
        return next(PopulateResponse.forbidden());
      }
      // shop featured
      const shopFeaturedPackage = await DB.ShopFeaturedPackage.findOne({ _id: value.itemId });
      if (!shopFeaturedPackage) {
        return next(PopulateResponse.notFound({
          message: 'Package not found!'
        }));
      }

      paymentData = {
        gateway: value.gateway,
        price: shopFeaturedPackage.price,
        returnUrl: url.resolve(nconf.get('baseUrl'), '/v1/payment/paypal/callback?action=success'),
        cancelUrl: url.resolve(nconf.get('baseUrl'), '/v1/payment/paypal/callback?action=cancel'),
        meta: value,
        userId: req.user._id,
        type: 'shop_featured',
        description: `Package: ${shopFeaturedPackage.name}`,
        products: {
          id: shopFeaturedPackage._id,
          price: shopFeaturedPackage.price,
          description: shopFeaturedPackage.name
        },
        itemId: shopFeaturedPackage._id,
        stripeToken: value.stripeToken
      };
    }

    const data = await Service.Payment.createSinglePayment(paymentData);

    res.locals.request = data;
    return next();
  } catch (e) {
    return next(e);
  }
};


exports.donate = async (req,res,next) => {
  console.log(req.body)
  let donationData = {
    userId: req.user._id,
    price: parseInt(req.body.amount),
    description: req.body.description,
    stripeToken: req.body.stripeToken
  }
  const data = await Service.Payment.createDonation(donationData);

  res.locals.request = data;
  return next();

}


exports.getBraintreeToken = async (req, res, next) => {
  try {
    const data = await Braintree.generateClientToken();
    res.locals.token = { token: data.clientToken };
    next();
  } catch (e) {
    next(e);
  }
};
