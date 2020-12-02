const _ = require('lodash');
const Joi = require('joi');

exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.optionId || req.body.optionId;
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const option = await DB.ProductOption.findOne({ _id: id });
    if (!option) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    req.option = option;
    res.locals.option = option;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * Create a new option
 */
exports.create = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      name: Joi.string().required(),
      key: Joi.string().required(),
      description: Joi.string().allow(['', null]).optional(),
      options: Joi.array().items(Joi.object().keys({
        key: Joi.string().required(),
        displayText: Joi.string().required()
      })).required()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const key = Helper.String.createAlias(req.body.key);
    const count = await DB.ProductOption.count({ key });
    if (count || validate.value.key === '_custom') {
      return next(PopulateResponse.error({
        message: 'Please add unique name for key'
      }));
    }

    const option = new DB.ProductOption(validate.value);
    await option.save();
    res.locals.option = option;
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
      name: Joi.string().optional(),
      description: Joi.string().allow(['', null]).optional(),
      options: Joi.array().items(Joi.object().keys({
        key: Joi.string().required(),
        displayText: Joi.string().required()
      })).optional()
    });

    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    _.assign(req.option, req.body);
    await req.option.save();
    res.locals.update = req.option;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await req.option.remove();
    res.locals.remove = {
      message: 'Option is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * get list option
 */
exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'key', 'description']
    });

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.ProductOption.count(query);
    const items = await DB.ProductOption.find(query)
      .collation({ locale: 'en' })
      .sort(sort).skip(page * take)
      .limit(take)
      .exec();

    res.locals.optionList = {
      count,
      items
    };
    next();
  } catch (e) {
    next(e);
  }
};
