const _ = require('lodash');
const Joi = require('joi');

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.shopFeaturedPackageId || req.body.shopFeaturedPackageId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const query = Helper.App.isMongoId(id) ? { _id: id } : { alias: id };
    const shopFeaturedPackage = await DB.ShopFeaturedPackage.findOne(query);
    if (!shopFeaturedPackage) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    req.shopFeaturedPackage = shopFeaturedPackage;
    res.locals.shopFeaturedPackage = shopFeaturedPackage;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * Create a new media shopFeaturedPackage
 */
exports.create = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      name: Joi.string().required(),
      description: Joi.string().allow([null, '']).optional(),
      price: Joi.number().required(),
      numDays: Joi.number().required(),
      ordering: Joi.number().optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const shopFeaturedPackage = new DB.ShopFeaturedPackage(validate.value);
    await shopFeaturedPackage.save();
    res.locals.shopFeaturedPackage = shopFeaturedPackage;
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
      name: Joi.string().required(),
      description: Joi.string().allow([null, '']).optional(),
      price: Joi.number().required(),
      numDays: Joi.number().required(),
      ordering: Joi.number().optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    _.merge(req.shopFeaturedPackage, validate.value);
    await req.shopFeaturedPackage.save();
    res.locals.update = req.shopFeaturedPackage;
    return next();
  } catch (e) {
    return next();
  }
};

exports.remove = async (req, res, next) => {
  try {
    await req.shopFeaturedPackage.remove();
    res.locals.remove = {
      message: 'Package is deleted'
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * get list shopFeaturedPackage
 */
exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = {};
    if (req.query.q) {
      query.$or = [{
        name: { $regex: req.query.q.trim(), $options: 'i' }
      }];
    }

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.ShopFeaturedPackage.count(query);
    const items = await DB.ShopFeaturedPackage.find(query)
      .sort(sort).skip(page * take).limit(take)
      .exec();

    res.locals.list = {
      count,
      items
    };
    next();
  } catch (e) {
    next();
  }
};
