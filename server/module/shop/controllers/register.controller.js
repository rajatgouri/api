const Joi = require('joi');
const nconf = require('nconf');
const url = require('url');

/**
 * register for shop
 */
exports.register = async (req, res, next) => {
  const schema = Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email().required(), // email of shop, or useremail
    password: Joi.string().min(6).optional(),
    phoneNumber: Joi.string().required(),
    phoneVerified: Joi.boolean().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    shopType: Joi.string().optional(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    zipcode: Joi.string().allow(['', null]).optional(),
    verificationIssueId: Joi.string().required()
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    let user = req.user;
    if (user && user.isShop) {
      return next(PopulateResponse.error({
        message: 'Your account has already registered with a shop. please try to login'
      }, 'ERR_ACCOUNT_HAVE_SHOP'));
    } else if (!user) {
      const emailExists = await DB.User.count({
        email: validate.value.email.toLowerCase()
      });

      if (emailExists) {
        return next(PopulateResponse.error({
          message: 'This email has already token'
        }, 'ERR_EMAIL_ALREADY_TAKEN'));
      }

      const phoneExists = await DB.User.count({
        phoneNumber: validate.value.phoneNumber.toLowerCase()
      });

      if (emailExists) {
        return next(PopulateResponse.error({
          message: 'This email has already token'
        }, 'ERR_EMAIL_ALREADY_TAKEN'));
      }

      if (phoneExists) {
        return next(PopulateResponse.error({
          message: 'This Phone is already Linked'
        }, 'ERR_PHONE_ALREADY_TAKEN'));
      }

      user = new DB.User(validate.value);
      user.emailVerifiedToken = Helper.String.randomString(48);
      await user.save();

      // now send email verificaiton to user
      await Service.Mailer.send('verify-email.html', user.email, {
        subject: 'Verify email address',
        emailVerifyLink: url.resolve(nconf.get('baseUrl'), `v1/auth/verifyEmail/${user.emailVerifiedToken}`)
      });
    }

    const shop = new DB.Shop(validate.value);
    shop.location = await Service.Shop.getLocation(validate.value);
    shop.ownerId = user._id;
    await shop.save();
    await DB.User.update({ _id: user._id }, {
      $set: {
        isShop: true,
        shopId: shop._id
      }
    });

  // Welcome Email
    await Service.Mailer.send('welcome.html', shop.email, {
      subject: 'Welcome to Tradenshare',
      name: shop.name,
      logo: url.resolve(nconf.get('baseUrl'), `assets/logo.jpg`),
      playstore: url.resolve(nconf.get('baseUrl'), `assets/playstore.jpg`),
      applestore: url.resolve(nconf.get('baseUrl'), `assets/applestore.jpg`),
      playstorelink: '',
      applestorelink: ''
    });

    // send alert email to admin
    if (process.env.EMAIL_NOTIFICATION_NEW_SHOP) {
      await Service.Mailer.send('shop/new-shop-register.html', process.env.EMAIL_NOTIFICATION_NEW_SHOP, {
        subject: 'New registered shop',
        shop: shop.toObject(),
        user: user.toObject(),
        shopUpdateUrl: url.resolve(process.env.adminWebUrl, `shops/update/${shop._id}`)
      });
    }

    res.locals.register = shop;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      // TODO - verify about file size, and type
      return next(PopulateResponse.error({
        message: 'Missing file!'
      }, 'ERR_MISSING_FILE'));
    }

    const file = new DB.Media({
      type: 'file',
      systemType: 'verification_issue',
      name: req.file.filename,
      mimeType: req.file.mimetype,
      originalPath: req.file.path,
      filePath: req.file.path,
      convertStatus: 'done'
    });
    await file.save();

    res.locals.document = {
      _id: file._id,
      name: req.file.filename
    };
    return next();
  } catch (e) {
    return next(e);
  }
};
