const _ = require('lodash');
const Joi = require('joi');

exports.findOne = async (req, res, next) => {
  try {
    const review = await DB.Review.findOne({ _id: req.params.reviewId }).populate('rater');
    if (!review) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    req.review = review;
    res.locals.review = review;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * Create a new rating
 */
exports.create = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      type: Joi.string().valid(['product', 'shop']).optional().default('product'),
      productId: Joi.string().allow([null, '']).when('type', {
        is: 'product',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      shopId: Joi.string().allow([null, '']).when('type', {
        is: 'shop',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      rating: Joi.number().min(1).max(5).required(),
      comment: Joi.string().allow([null, '']).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const review = await Service.Review.create(req.user, validate.value);
    review.rater = req.user.getPublicProfile();
    res.locals.review = review;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * do update for user profile or admin update
 */
exports.update = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      rating: Joi.number().min(1).max(5).optional(),
      comment: Joi.string().allow([null, '']).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    if (req.user.role !== 'admin' && req.user._id.toString() !== req.review.rateBy.toString()) {
      return next(PopulateResponse.forbidden());
    }

    _.merge(req.review, validate.value);
    await req.review.save();
    if (req.review.type === 'product') {
      await Service.Review.updateReviewScoreProduct(req.review.productId);
    } else {
      await Service.Review.updateReviewScoreShop(req.review.shopId);
    }
    req.review.rater = req.user.getPublicProfile();
    res.locals.update = req.review;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await req.review.remove();
    await Service.Review.updateReviewScoreProduct(req.review.productId);
    res.locals.remove = {
      message: 'Review is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * get list review
 */
exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      equal: ['productId', 'rateBy', 'shopId', 'type']
    });

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Review.count(query);
    const items = await DB.Review.find(query)
      .populate('rater')
      .sort(sort).skip(page * take)
      .limit(take)
      .exec();

    res.locals.list = {
      count,
      items
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.canReview = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      type: Joi.string().valid(['product', 'shop']).optional().default('product'),
      productId: Joi.string().allow([null, '']).when('type', {
        is: 'product',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      shopId: Joi.string().allow([null, '']).when('type', {
        is: 'shop',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    if (!req.user) {
      res.locals.canReview = { canReview: false };
      return next();
    }

    const canReview = await Service.Review.canReview(req.user._id, validate.value);
    res.locals.canReview = { canReview };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.getMyCurrentReview = async (req, res, next) => {
  try {
    const query = {
      rateBy: req.user._id
    };
    if (req.params.type === 'product') {
      query.productId = req.params.itemId;
    } else if (req.params.type === 'shop') {
      query.shopId = req.params.itemId;
    }
    const review = await DB.Review.findOne(query);
    res.locals.review = review;
    next();
  } catch (e) {
    next(e);
  }
};
