const _ = require('lodash');
const Joi = require('joi');

const validateSchema = Joi.object().keys({
  name: Joi.string().required(),
  alias: Joi.string().allow([null, '']).optional(),
  description: Joi.string().allow([null, '']).optional(),
  ordering: Joi.number().allow([null, '']).optional(),
  parentId: Joi.string().allow([null, '']).optional(),
  mainImage: Joi.string().allow([null, '']).optional().default(null),
  specifications: Joi.array().items(Joi.string()).optional().default([]),
  chemicalIdentifiers: Joi.array().items(Joi.string()).optional().default([]),
  metaSeo: Joi.object().keys({
    keywords: Joi.string().allow([null, '']).optional(),
    description: Joi.string().allow([null, '']).optional()
  }).optional()
});

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.productCategoryId || req.body.productCategoryId;
    const query = {};
    if (Helper.App.isMongoId(id)) {
      query._id = id;
    } else {
      query.alias = id;
    }
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const productCategory = await DB.ProductCategory.findOne(query).populate('mainImage');
    if (!productCategory) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    req.productCategory = productCategory;
    res.locals.productCategory = productCategory;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * Create a new media productCategory
 */
exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    let alias = req.body.alias ? Helper.String.createAlias(req.body.alias) : Helper.String.createAlias(req.body.name);
    const count = await DB.ProductCategory.count({ alias });
    if (count) {
      alias = `${alias}-${Helper.String.randomString(5)}`;
    }

    if (!validate.value.parentId) {
      validate.value.parentId = null;
    }
    const productCategory = new DB.ProductCategory(Object.assign(validate.value, {
      alias
    }));
    await productCategory.save();
    res.locals.productCategory = productCategory;
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
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    let alias = req.body.alias ? Helper.String.createAlias(req.body.alias) : Helper.String.createAlias(req.body.name);
    const count = await DB.ProductCategory.count({
      alias,
      _id: { $ne: req.productCategory._id }
    });
    if (count) {
      alias = `${alias}-${Helper.String.randomString(5)}`;
    }

    if (!validate.value.parentId) {
      validate.value.parentId = null;
    }
    _.assign(req.productCategory, validate.value);

    await req.productCategory.save();
    res.locals.update = req.productCategory;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    // allow to delete if have no sub category and product
    const subChildCount = await DB.ProductCategory.count({ parentId: req.productCategory._id });
    if (subChildCount) {
      return next(PopulateResponse.error(null, 'Please delete sub categories first.'));
    }

    await req.productCategory.remove();

    res.locals.remove = {
      message: 'Category is deleted'
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * get list productCategory
 */
exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'alias']
    });

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.ProductCategory.count(query);
    const items = await DB.ProductCategory.find(query)
      .populate({
        path: 'mainImage',
        select: '_id filePath mediumPath thumbPath uploaded type'
      })
      .collation({ locale: 'en' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.productCategoryList = {
      count,
      items
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.tree = async (req, res, next) => {
  try {
    const categories = await DB.ProductCategory.find()
      .populate({
        path: 'mainImage',
        select: '_id filePath mediumPath thumbPath uploaded type'
      })
      .sort({ ordering: -1 });
    const tree = Helper.Utils.unflatten(categories.map(c => c.toJSON()));

    res.locals.tree = tree;
    next();
  } catch (e) {
    next(e);
  }
};
