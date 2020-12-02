const Joi = require('joi');
const nconf = require('nconf');
const url = require('url');
const jwt = require('jsonwebtoken');
const signToken = require('./auth.service').signToken;
const accountSid = process.env.SMS_SID;
const authToken = process.env.SMS_AUTH_TOKEN;
const twilio = require('twilio')(accountSid, authToken);


exports.register = async (req, res, next) => {
  let schema = Joi.object().keys({
    type: Joi.string().allow(['user']).default('user'),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phoneNumber: Joi.string().allow(['', null]).optional(),
    name: Joi.string().allow(['', null]).optional(),
    isShop: Joi.boolean(),
    phoneVerified: Joi.boolean(),
    gender: Joi.string().allow(['', null]).optional(),
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {

    let emailExists = await DB.User.count({
      email: validate.value.email.toLowerCase()
    });

    let phoneExists = await DB.User.count({
      phoneNumber: validate.value.phoneNumber.toLowerCase()
    });

    
    if (emailExists) {
      return next(PopulateResponse.error({
        message: 'This email has already taken'
      }, 'ERR_EMAIL_ALREADY_TAKEN'));
    }

    if (phoneExists) {
      return next(PopulateResponse.error({
        message: 'This Phone is Already Linked'
      }, 'ERR_Phone_ALREADY_TAKEN'));
    }

    const user = new DB.User(validate.value);
    user.emailVerifiedToken = Helper.String.randomString(48);
    await user.save();

    // welcome email
    await Service.Mailer.send('welcome.html', user.email, {
      subject: 'Welcome to Tradenshare',
      name: user.name,
      logo: url.resolve(nconf.get('baseUrl'), `assets/logo.png`),
      playstore: url.resolve(nconf.get('baseUrl'), `assets/playstore.jpg`),
      applestore: url.resolve(nconf.get('baseUrl'), `assets/applestore.jpg`),
      playstorelink: '',
      applestorelink: ''
    });

    // now send email verificaiton to user
    await Service.Mailer.send('verify-email.html', user.email, {
      subject: 'Verify email address',
      emailVerifyLink: url.resolve(nconf.get('baseUrl'), `v1/auth/verifyEmail/${user.emailVerifiedToken}`)
    });

    res.locals.register = PopulateResponse.success({
      message: 'Your account has been created, please verify your email address and get access.'
    }, 'USE_CREATED');
    return next();
  } catch (e) {
    return next(e);
  }
};


exports.getOtp = async (req,res,next) => {
  let schema = Joi.object().keys({
    via: Joi.string().allow(['', null]).required(),
    value: Joi.string().allow(['', null]).required()
  });

  let  validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {

    let user;
    const re = new RegExp("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])+")

    if(re.test(req.body.value)){
        user = await DB.User.findOne({ email: req.body.value, isActive: true })
    } else {
        user = await DB.User.findOne({ phoneNumber: req.body.value, isActive: true })
    }

    if(!user) {
      return next(PopulateResponse.notFound());
    }

    user = user.toObject()
    
    const expireTokenDuration = 60 * 15; // 15 mins
    const now = new Date();
    const expiredAt = new Date(now.getTime() + (expireTokenDuration * 1000));
    const token = Math.floor(100000 + Math.random() * 900000); 
    
    await DB.User.update({ _id: user._id }, {
      $set: {
        otp: {
          via: req.body.via,
          value: token,
          expiration: expiredAt
        },
      }
    });

    if(req.body.via === 'email') {
      await Service.Mailer.send('otp.html', user.email, {
        subject: 'OTP for Tradenshare Login',
        token: token,
        username: user.name
      });
    } else  {
      twilio.messages.create({body: 
        `
        OTP for Tradenshare login is ${token} 
        This is Valid only for 15 mins. 
        `,
        from: nconf.get('SMS_FROM'), to: user.phoneNumber})
        .then(message => console.log(message.sid));
    }

    res.locals.otp = PopulateResponse.success({
      status: true
    });
    return next();
  } catch (e) {
    return next(e);
  }
}

exports.loginWithOtp = async (req,res,next) => {
  const schema = Joi.object().keys({
    email: Joi.string().optional(),
    via: Joi.string().required(),
    phoneNumber: Joi.string().optional(),
    password: Joi.string().required()
  });


  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    
    let user;

    if(req.body.via === 'email') {
       user = await DB.User.findOne({email: req.body.email});
    } else {
      user = await DB.User.findOne({phoneNumber: req.body.phoneNumber});
    }

    if(!user) {
      return next(PopulateResponse.error({
        message: 'Something Went Wrong'
      }, 'ERR_UNKNOWN'));
    }

    user = user.toObject();

    console.log(user)
    let currentDate = new Date()
    let expirationDate = new Date(user.otp.expiration)

    if((currentDate > expirationDate )) {
      return next(PopulateResponse.error({
        message: 'Token Expires'
      }, 'ERR_TOKEN_EXPIRES'));
    } else if (req.body.password !== user.otp.value) {
      return next(PopulateResponse.error({
        message: 'Token INVALID'
      }, 'ERR_TOKEN_INVALID'));
    }
    

    const expireTokenDuration = 60 * 60 * 24 * 7; // 7 days
    const now = new Date();
    const expiredAt = new Date(now.getTime() + (expireTokenDuration * 1000));
    const token = signToken(user._id, user.role, expireTokenDuration);

    res.locals.login = PopulateResponse.success({
      token,
      expiredAt
    });
    return next();
  } catch (e) {
    return next(e);
  }


}

exports.Autologin = async (req,res,next) => {
  const schema = Joi.object().keys({
    token: Joi.string().required(),    
  });


  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    var decoded = jwt.verify(req.body.token, process.env.SESSION_SECRET);

    let data = decoded.data;

    let user = await DB.User.findOne({email: data.email, shopId: data.shopId, password: data.password });

    if(!user) {
      return next(PopulateResponse.error({
        message: 'Something Went Wrong'
      }, 'ERR_UNKNOWN'));
    }

    const expireTokenDuration = 60 * 60 * 24 * 7; // 7 days
    const now = new Date();
    const expiredAt = new Date(now.getTime() + (expireTokenDuration * 1000));
    const token = signToken(user._id, user.role, expireTokenDuration);

    res.locals.login = PopulateResponse.success({
      token,
      expiredAt
    });
    return next();
  } catch (e) {
    return next(e);
  }

}

exports.emailExists = async (req, res, next) => {
  const schema = Joi.object().keys({
    email: Joi.string().email().required(),    
  });


  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    const count = await DB.User.count({
      email: validate.value.email.toLowerCase()
    });
    if (count) {
      return next(PopulateResponse.error({
        message: 'This email has already taken'
      }, 'ERR_EMAIL_ALREADY_TAKEN'));
    }

    res.locals.register = PopulateResponse.success({
      message: 'Email not exists .'
    });
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.verifyEmail = async (req, res, next) => {
  const schema = Joi.object().keys({
    token: Joi.string().required()
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    const user = await DB.User.findOne({
      emailVerifiedToken: req.body.token
    });
    if (!user) {
      return next(PopulateResponse.error({
        message: 'This token is incorrect'
      }, 'ERR_INVALID_EMAIL_VERIFY_TOKEN'));
    }

    user.emailVerified = true;
    user.emailVerifiedToken = null;
    await user.save();

    res.locals.verifyEmail = PopulateResponse.success({
      message: 'Your email has been verified.'
    }, 'EMAIL_VERIFIED');
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.verifyEmailView = async (req, res, next) => {
  try {
    const user = await DB.User.findOne({
      emailVerifiedToken: req.params.token
    });

    if (user) {
      user.emailVerified = true;
      user.emailVerifiedToken = null;
      await user.save();
    }

    return res.render('auth/verify-email.html', {
      verified: user !== null,
      siteName: nconf.get('SITE_NAME')
    });
  } catch (e) {
    return next(e);
  }
};

exports.forgot = async (req, res, next) => {
  const schema = Joi.object().keys({
    email: Joi.string().email().required()
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }

  try {
    const user = await DB.User.findOne({
      email: validate.value.email
    });
    if (!user) {
      return next(PopulateResponse.error({
        message: 'This email is not registered'
      }, 'ERR_INVALID_EMAIL_ADDRESS'));
    }

    const passwordResetToken = Helper.String.randomString(48);
    await DB.User.update({
      _id: user._id
    }, {
      $set: { passwordResetToken }
    });

    // now send email verificaiton to user
    await Service.Mailer.send('forgot-password.html', user.email, {
      subject: 'Forgot password',
      passwordResetLink: url.resolve(nconf.get('baseUrl'), `v1/auth/passwordReset/${passwordResetToken}`),
      user: user.toObject()
    });

    res.locals.forgot = PopulateResponse.success({
      message: 'Your password email has been sent.'
    }, 'FORGOT_PASSWORD_EMAIL_SENT');
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.resetPasswordView = async (req, res, next) => {
  try {
    const user = await DB.User.findOne({
      passwordResetToken: req.params.token
    });

    if (!user) {
      return res.render('not-found.html');
    }

    if (req.method === 'GET') {
      return res.render('auth/change-password.html', {
        openForm: true
      });
    }

    if (!req.body.password) {
      return res.render('auth/change-password.html', {
        openForm: true,
        error: true,
        siteName: nconf.get('SITE_NAME')
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = null;
    await user.save();

    return res.render('auth/change-password.html', {
      openForm: false,
      error: false,
      siteName: nconf.get('SITE_NAME')
    });
  } catch (e) {
    return next(e);
  }
};

