const Joi = require('joi');
const LoginWithTwitter = require('login-with-twitter');
const url = require('url');
const nconf = require('nconf');

exports.connectFacebook = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      accessToken: Joi.string().required()
    });

    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const data = await Service.SocialConnect.Facebook.getProfile(validate.value.accessToken);
    let social = await DB.UserSocial.findOne({
      userId: req.user._id,
      socialId: data.id,
      social: 'facebook'
    });
    if (!social) {
      social = new DB.UserSocial({
        userId: req.user._id,
        social: 'facebook',
        socialId: data.id
      });
    }
    social.accessToken = validate.value.accessToken;
    social.socialInfo = data;
    await social.save();
    await Service.Shop.updateTrustedSocialAccount(social);

    res.locals.connect = {
      success: true
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.connectGoogle = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      accessToken: Joi.string().required()
    });

    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const data = await Service.SocialConnect.Google.getProfile(validate.value.accessToken);
    let social = await DB.UserSocial.findOne({
      userId: req.user._id,
      socialId: data.id,
      social: 'google'
    });
    if (!social) {
      social = new DB.UserSocial({
        userId: req.user._id,
        social: 'google',
        socialId: data.id
      });
    }
    social.accessToken = validate.value.accessToken;
    social.socialInfo = data;
    await social.save();
    await Service.Shop.updateTrustedSocialAccount(social);

    res.locals.connect = {
      success: true
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.connectTwitter = async (req, res, next) => {
  try {
    const tw = new LoginWithTwitter({
      consumerKey: process.env.TWITTER_CONSUMER_API_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackUrl: url.resolve(nconf.get('baseUrl'), 'v1/connect/twitter/callback')
    });
    const data = await new Promise((resolve, reject) => tw.login((err, token, redirectUrl) => {
      if (err) {
        return reject(err);
      }

      return resolve({
        token,
        redirectUrl
      });
    }));

    // TODO - add session!
    req.session.twitterToken = data.token;
    req.session.userId = req.user._id;
    if (req.query.redirectUrl) {
      req.session.redirectUrl = req.query.redirectUrl;
    }

    res.redirect(data.redirectUrl);
  } catch (e) {
    next(e);
  }
};

exports.connectTwitterCallback = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return next(PopulateResponse.error({
        message: 'Please try to login before do callback!'
      }));
    }

    const tw = new LoginWithTwitter({
      consumerKey: process.env.TWITTER_CONSUMER_API_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackUrl: url.resolve(nconf.get('baseUrl'), 'v1/connect/twitter/callback')
    });

    const data = await new Promise((resolve, reject) => tw.callback(req.query, req.session.twitterToken, (err, resp) => {
      if (err) {
        return reject(err);
      }

      return resolve(resp);
    }));

    let social = await DB.UserSocial.findOne({
      userId: req.session.userId,
      socialId: data.userId,
      social: 'twitter'
    });
    if (!social) {
      social = new DB.UserSocial({
        userId: req.session.userId,
        socialId: data.userId,
        social: 'twitter'
      });
    }
    social.accessToken = data.userToken;
    social.refreshToken = data.userTokenSecret;
    social.socialInfo = data;
    await social.save();
    await Service.Shop.updateTrustedSocialAccount(social);

    if (req.session.redirectUrl) {
      return res.redirect(req.session.redirectUrl);
    }

    res.locals.connect = {
      success: true
    };
    return next();
  } catch (e) {
    return next(e);
  }
};
