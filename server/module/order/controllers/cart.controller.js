const Joi = require('joi');

exports.calculate = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      products: Joi.array().items(Joi.object().keys({
        productId: Joi.string().required(),
        productVariantId: Joi.string().allow([null, '']).optional(),
        quantity: Joi.number().allow([null]).optional().default(1),
        startDate: Joi.date().allow([null]).optional(),
        endDate: Joi.date().allow([null]).optional(),
        couponCode: Joi.string().allow([null, '']).optional()
      }).unknown()).required(),
      // TODO - update me
      shippingMethod: Joi.string().allow(['cod']).optional().default('cod'),
      shippingAddress: Joi.string().allow([null, '']).optional(),
      paymentMethod: Joi.string().allow(['cod']).optional().default('cod'),
      phoneNumber: Joi.string().allow([null, '']).optional(),
      email: Joi.string().allow([null, '']).optional(),
      firstName: Joi.string().allow([null, '']).optional(),
      lastName: Joi.string().allow([null, '']).optional(),
      streetAddress: Joi.string().allow([null, '']).optional(),
      city: Joi.string().allow([null, '']).optional(),
      state: Joi.string().allow([null, '']).optional(),
      country: Joi.string().allow([null, '']).optional(),
      zipCode: Joi.string().allow([null, '']).optional(),
      userCurrency: Joi.string().optional()
    });

    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    res.locals.calculate = await Service.Cart.calculate(validate.value);
    return next();
  } catch (e) {
    return next(e);
  }
};
