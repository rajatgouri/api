const Joi = require('joi');
const _ = require('lodash');

exports.create = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      key: Joi.string().required(),
      name: Joi.string().required(),
      flag: Joi.string().allow([null, '']).optional(),
      isDefault: Joi.boolean().allow([null]).optional(),
      isActive: Joi.boolean().allow([null]).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const count = await DB.I18nLanguage.findOne({ key: validate.value.key });
    if (count) {
      return next(PopulateResponse.error({
        message: 'Key has been exist'
      }));
    }
    const language = new DB.I18nLanguage(validate.value);
    await language.save();

    if (language.isDefault) {
      await DB.I18nLanguage.updateMany({
        _id: { $ne: language._id }
      }, {
        $set: {
          isDefault: false
        }
      });
    }

    res.locals.create = language;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      key: Joi.string().optional(),
      name: Joi.string().optional(),
      flag: Joi.string().allow([null, '']).optional(),
      isDefault: Joi.boolean().allow([null]).optional(),
      isActive: Joi.boolean().allow([null]).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const language = await DB.I18nLanguage.findOne({ _id: req.params.languageId });
    if (!language) {
      return next(PopulateResponse.notFound());
    }
    _.merge(language, validate.value);
    await language.save();

    if (language.isDefault) {
      await DB.I18nLanguage.updateMany({
        _id: { $ne: language._id }
      }, {
        $set: {
          isDefault: false
        }
      });
    }

    res.locals.update = language;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const language = await DB.I18nLanguage.findOne({ _id: req.params.languageId });
    if (!language) {
      return next(PopulateResponse.notFound());
    }
    await language.remove();

    res.locals.remove = {
      success: true
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const query = {};
    if (!req.user || req.user.role !== 'admin') {
      query.isActive = true;
    }

    const count = await DB.I18nLanguage.count(query);
    const items = await DB.I18nLanguage.find(query);

    res.locals.list = { count, items };
    next();
  } catch (e) {
    next(e);
  }
};
