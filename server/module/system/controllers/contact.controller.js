const Joi = require('joi');

exports.send = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      message: Joi.string().required()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    await Service.Mailer.send('contact/message.html', process.env.ADMIN_EMAIL, Object.assign(validate.value, {
      subject: `New contact from ${validate.value.name}`
    }));

    res.locals.send = { success: true };
    return next();
  } catch (e) {
    return next();
  }
};
