const Joi = require('joi');

exports.sendEmail = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      subject: Joi.string().required(),
      content: Joi.string().allow([null, '']).optional(),
      userType: Joi.string().allow([null, '']).optional()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    await Service.Newsletter.sendMail(validate.value);
    res.locals.sendEmail = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};
