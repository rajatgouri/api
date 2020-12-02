const Joi = require('joi');
const _ = require('lodash');

exports.create = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      content: Joi.string().required()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const complain = await Service.Complain.create(req.user._id, validate.value);
    res.locals.create = complain;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0;
    const take = parseInt(req.query.take, 10) || 10;
    const query = Helper.App.populateDbQuery(req.query, {
      equal: ['status']
    });
    // TODO - define query

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Complain.count(query);
    const items = await DB.Complain.find(query)
      .populate('user')
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.list = {
      count,
      items: items.map((item) => {
        const data = item.toObject();
        if (item.user) {
          data.user = item.user.getPublicProfile();
        }
        return data;
      })
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const complain = await DB.Complain.findOne({ _id: req.params.complainId })
      .populate('user');
    if (!complain) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    const data = complain.toObject();
    if (complain.user) {
      data.user = complain.user.getPublicProfile();
    }

    req.complain = complain;
    res.locals.complain = complain;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await DB.Complain.remove({ _id: req.params.complainId });
    res.locals.remove = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      content: Joi.string().optional(),
      note: Joi.string().optional(),
      status: Joi.string().valid(['pending', 'rejected', 'resolved']).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const complain = await Service.Complain.update(req.params.complainId, validate.value);
    res.locals.update = complain;
    return next();
  } catch (e) {
    return next(e);
  }
};
