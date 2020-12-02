const Joi = require('joi');

exports.request = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      payoutAccountId: Joi.string().required()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const payoutAccount = await DB.PayoutAccount.findOne({
      _id: req.body.payoutAccountId
    });
    if (!payoutAccount) {
      return next(PopulateResponse.notFound());
    }

    const data = await Service.PayoutRequest.sendRequest(req.user.shopId, payoutAccount);
    res.locals.request = data;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.reject = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      rejectReason: Joi.string().allow([null, '']).optional(),
      note: Joi.string().allow([null, '']).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    await Service.PayoutRequest.rejectRequest(req.params.requestId, validate.value);
    res.locals.reject = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.approve = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      note: Joi.string().allow([null, '']).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    await Service.PayoutRequest.approveRequest(req.params.requestId, validate.value);
    res.locals.approve = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const query = Helper.App.populateDbQuery(req.query, {
      equal: ['type', 'shopId', 'status'],
      text: ['code']
    });
    const sort = Helper.App.populateDBSort(req.query);

    if (req.user.role !== 'admin') {
      query.shopId = req.user.shopId;
    }

    const count = await DB.PayoutRequest.count(query);
    const items = await DB.PayoutRequest.find(query)
      .populate('shop')
      .collation({ locale: 'en' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();
    res.locals.list = {
      count,
      items
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.findOne = async (req, res, next) => {
  try {
    const payoutRequest = await DB.PayoutRequest.findOne({ _id: req.params.requestId }).populate('shop');
    if (!payoutRequest) {
      return next(PopulateResponse.notFound());
    }
    if (req.user.role !== 'admin' && payoutRequest.shopId.toString() !== req.user.shopId.toString()) {
      return next(PopulateResponse.forbbiden());
    }

    const data = payoutRequest.toObject();
    data.items = await Service.PayoutRequest.getItemDetails(payoutRequest._id);
    // load details order of this item
    res.locals.payoutRequest = data;
    return next();
  } catch (e) {
    return next();
  }
};


exports.do_payout = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      id: Joi.string(),
      paidPayoutAmount: Joi.number()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const data = await Service.Payment.createSellerPayout(validate.value);
    if(data.status === 'paid')
    {
      res.locals.result = { success: true };
    } else {
      res.locals.result = { fail: true, message: data.message };
    }
    
    return next();
  } catch (e) {
    return next(e);
  }
};
