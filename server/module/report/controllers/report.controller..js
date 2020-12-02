const Joi = require('joi');
const _ = require('lodash');

exports.create = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      content: Joi.string().required(),
      type: Joi.string().required(),
      shopId: Joi.string().required()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const shop = await DB.Shop.findOne({ _id: validate.value.shopId });
    if (!shop) {
      return next(PopulateResponse.notFound({
        message: 'Shop not found'
      }));
    }

    const report = new DB.Report(Object.assign(validate.value, {
      userId: req.user._id,
      code: Helper.String.randomString(5).toUpperCase()
    }));
    await report.save();

    Service.Mailer.send('report/notify-admin.html', process.env.EMAIL_NOTIFICATION_REPORT, {
      subject: `Report #${report.code}`,
      user: req.user.toObject(),
      report: report.toObject(),
      shop: shop.toObject()
    });

    res.locals.create = report;
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
    const count = await DB.Report.count(query);
    const items = await DB.Report.find(query)
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
    const report = await DB.Brand.findOne({ _id: req.params.reportId })
      .populate('user');
    if (!report) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    const data = report.toObject();
    if (report.user) {
      data.user = report.user.getPublicProfile();
    }

    req.report = report;
    res.locals.report = report;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await DB.Report.remove({ _id: req.params.reportId });
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
      type: Joi.string().optional(),
      status: Joi.string().valid(['pending', 'rejected', 'resolved']).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const report = await DB.Report.findOne({ _id: req.params.reportId });
    if (!report) {
      return next(PopulateResponse.notFound());
    }

    _.merge(report, validate.value);
    await report.save();
    res.locals.update = report;
    return next();
  } catch (e) {
    return next(e);
  }
};
