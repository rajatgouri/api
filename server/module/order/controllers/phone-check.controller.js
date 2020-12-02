const Joi = require('joi');

exports.check = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      phoneNumber: Joi.string().required(),
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    let phoneCheck = await DB.PhoneCheck.findOne({
      phoneNumber: validate.value.phoneNumber,
      userId: req.user ? req.user._id : null
    });
    const code = Helper.String.randomString(5).toUpperCase();
    if (!phoneCheck) {
      phoneCheck = new DB.PhoneCheck({
        phoneNumber: validate.value.phoneNumber,
        userId: req.user ? req.user._id : null,
        code
      });
    }

    await phoneCheck.save();
    Service.Sms.send({
      text: `Your order phone verify code number is: ${phoneCheck.code}`,
      to: phoneCheck.phoneNumber
    });
    // TODO - remove in prod env
    res.locals.check = phoneCheck;
    return next();
  } catch (e) {
    return next(e);
  }
};
