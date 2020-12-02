const _ = require('lodash');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const Image = require('../../media/components/image');
const jwt = require('jsonwebtoken');
const url = require('url');
const accountSid = process.env.SMS_SID;
const authToken = process.env.SMS_AUTH_TOKEN;
const verificationCode = process.env.VERIFICATION_SID;
const twilio = require('twilio')(accountSid, authToken);
const nconf = require('nconf');
/**
 * Create a new user
 */
exports.create = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required()
    }).unknown();

    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const data = req.body;
    if (data.role !== 'admin') {
      data.role = 'user';
    }

    const user = await Service.User.create(data);
    res.locals.user = user;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * do update for user profile or admin update
 */
exports.update = async (req, res, next) => {
  try {
    let user = req.params.id ? await DB.User.findOne({ _id: req.params.id }) : req.user;
    //user.avatar = 
    let phoneExists = await DB.User.findOne({ phoneNumber: req.body.phoneNumber, _id: {$ne: user._id} })

    if(phoneExists) {
      return next(PopulateResponse.error({
        message: 'This Phone is Already Taken'
      }, 'ERR_INVALID_PHONE'));
    }

    if (user.user) {
      user.user = user.user.getPublicProfile();
    }

    let publicFields = [
      'name', 'password', 'address', 'phoneNumber', 'gender', 'phoneVerified' , 'streetAddress', 'city', 'state', 'country', 'zipCode', 'shippingAddress'
    ];
    if (req.user.role === 'admin') {
      publicFields = publicFields.concat([
        'isActive', 'emailVerified', 'role'
      ]);
    }
    const fields = _.pick(req.body, publicFields);

    _.merge(user, fields);
    await user.save();

    let shop =  await DB.Shop.findOne({ ownerId: req.params.id }); 

    if(shop) {
      shop.phoneNumber = user.phoneNumber;
      shop.save();
    }

    res.locals.update = user;
    next();
  } catch (e) {
    next(e);
  } 
};

exports.me = (req, res, next) => {
  res.locals.me = req.user;
  next();
};

exports.findOne = async (req, res, next) => {
  try {
    const user = await DB.User.findOne({
      _id: req.params.id
    });

    res.locals.user = user;
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * update user avatar
 */
exports.updateAvatar = async (req, res, next) => {
  try {

    if (!req.file) {
      return next(PopulateResponse.error({
        message: 'Please Select a file type jpg, png and jpeg'
      }, 'ERR_INVALID_FILE'));
    }
    const user = req.params.id ? await DB.User.findOne({ _id: req.params.id }) : req.user;
    if (!user) {
      return next(PopulateResponse.notFound());
    }

    

    const update = {
      avatar: req.file.path
    };


    if (process.env.USE_S3 === 'true') {
      const s3Data = await Service.S3.uploadFile(req.file.path, {
        ACL: 'public-read',
        fileName: `avatars/${Helper.String.getFileName(req.file.path)}`
      });
      update.avatar = s3Data.url;
    }


    await DB.User.update({ _id: req.params.id || req.user._id }, {
      $set: update
    });

    
    // unlink old avatar
    if (user.avatar && !Helper.String.isUrl(user.avatar) && fs.existsSync(path.resolve(user.avatar))) {
      fs.unlinkSync(path.resolve(user.avatar));
    }


    // TODO - remove old avatar in S3?
    if (process.env.USE_S3 === 'true' && fs.existsSync(path.resolve(req.file.path))) {
      fs.unlinkSync(path.resolve(req.file.path));
    }

    res.locals.updateAvatar = {
      url: DB.User.getAvatarUrl(update.avatar)
    };

    return next();
  } catch (e) {
    console.log(e)
    return next(e);
  }
};

exports.search = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'phoneNumber', 'email', 'username'],
      boolean: ['isActive', 'phoneVerified', 'emailVerified', 'isShop'],
      equal: ['role']
    });

    if (req.query.role === 'seller') {
      query.role = 'user';
      query.isShop = true;
    }

    if (req.query.role === 'user') {
      query.role = 'user';
      query.isShop = false;
    }

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.User.count(query);
    const items = await DB.User.find(query)
      .collation({ locale: 'en' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.search = {
      count,
      items
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const user = DB.User.findOne({ _id: req.params.userId });
    const seller = await DB.Shop.findOne({ ownerId: req.params.userId});
    const conversation = await DB.Conversation.find({ memberIds: { $all: [req.params.userId] } });
    if (!user) {
      return next(PopulateResponse.notFound());
    }

    if (user.role === 'admin') {
      return next(PopulateResponse.forbidden());
    }

    if(seller) {
      const product = await DB.Product.find({ shopId: seller._id});

      if(product && product.length) {
        const prodIds = product.map(c => c._id);

        //remove review by product
        await DB.Review.deleteMany({ productId: {$in: prodIds} });

        //remove wistlist by product
        await DB.Wishlist.deleteMany({ productId: {$in: prodIds} });

        //remove variant
        await DB.ProductVariant.deleteMany({ productId: {$in: prodIds} });
      }

      //remove coupon
      await DB.Coupon.deleteMany({ shopId: seller._id});

      //remove Payout Item
      await DB.PayoutItem.deleteMany({ shopId: seller._id });

      //remove product
      await DB.Product.deleteMany({ shopId: seller._id});
      
      //remove PayoutRequest
      await DB.PayoutRequest.deleteMany({ shopId: seller._id});

      //remove review by seller
      await DB.Review.deleteMany({ shopId: seller._id });

      //remove report
      await DB.Report.deleteMany({ shopId: seller._id });

      //remove complaint by seller
      await DB.Report.deleteMany({ shopId: seller._id });
    }

    if(conversation && conversation.length) {
      const conIds = conversation.map(c => c._id);
      
      //remove message
      await DB.Message.deleteMany({ conversationId: {$in: conIds}});

       //remove ConversationUserMeta
      await DB.ConversationUserMeta.deleteMany({ conversationId: {$in: conIds}});
    }

    //remove user
    await user.remove();

    //remove shop
    await DB.Shop.remove({ ownerId: req.params.userId });

    //remove conversation
    await DB.Conversation.deleteMany({ memberIds: { $all: [req.params.userId] } });

    //remove complaint by user
    await DB.Report.deleteMany({ userId: req.params.userId });

    //remove invoices
    await DB.Invoice.deleteMany({ userId: req.params.userId });

    //remove Payout Account
    await DB.PayoutAccount.deleteMany({ userId: req.params.userId });

    //remove Order
    await DB.Order.deleteMany({ customerId: req.params.userId });

    //remove wistlist by user
    await DB.Wishlist.deleteMany({ userId: req.params.userId });

    res.locals.remove = {
      success: true
    };
    return next();
  } catch (e) {
    return next(e);
  }
};



exports.generateToken = async (req, res, next) => {
  try {

    const schema = Joi.object().keys({
      email: Joi.string().optional(),
      phone: Joi.string().optional(),
    }).unknown();

    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const user = req.body.email ? await DB.User.findOne({ email: req.body.email , isShop: true }).populate({'path': 'shopId', 'model': 'Shop'}) : await DB.User.findOne({ phoneNumber: req.body.phone , isShop: true}).populate({'path': 'shopId', 'model': 'Shop'});
    let jwtToken = '';

    if (!user) {
      return next(PopulateResponse.error({
        message: 'This user is not registered'
      }, 'ERR_INVALID_USER'));
    } else {
      
      let expireTokenDuration = Math.floor(Date.now() / 1000) + (60 * 15); // 15 minutes
    
      jwtToken = jwt.sign({
        exp: expireTokenDuration,
        data: {
          shopId: user.shopId._id,
          email: user.email,
          password: user.password
        }
      }, process.env.SESSION_SECRET);

      const update = {
        autoLoginToken: jwtToken,
      };
      
      await DB.User.update({
        _id: user._id
      }, {
        $set: update
      });
  
      if(req.body.email) {
        await Service.Mailer.send('auto-login.html', user.email, {
          subject: 'Welcome to Tradenshare',
          name: user.name,
          link: url.resolve(process.env.sellerWebUrl, `auth/autologin/${jwtToken}`),
        });
      } else {
        let link = url.resolve(process.env.sellerWebUrl, `auth/autologin/${jwtToken}`)
        twilio.messages.create({body: 
        `
        Welcome ${user.name} to Trade-N-Share, Please click this link to go to your shop, this link is valid only for 15 minutes. ${link}.
        `,
        from: nconf.get('SMS_FROM'), to: req.body.phone})
        .then(message => console.log(message.sid));
      }
    }
 

    res.locals.token = PopulateResponse.success({
      autoLoginToken: jwtToken
    }, 'TOKEN_GENERATED');
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * Generate token for auto login for seller, trader and renter
 */
exports.generatetoken = async (req, res, next) => {
  try {

    const schema = Joi.object().keys({
      _id: Joi.string().required(),
    }).unknown();

    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const user = req.body._id ? await DB.User.findOne({ _id: req.body._id }) : req.user;

    if (!user) {
      return next(PopulateResponse.error({
        message: 'This user is not registered'
      }, 'ERR_INVALID_USER'));
    }

    //This is to crete shop for that user
    if(user && !user.shopId && req.body.type == 'seller')
    {
      let shopData = {};
      shopData.ownerId = user._id;
      shopData.name = user.name;
      shopData.email = user.email;
      shopData.phoneNumber = user.phoneNumber;
      shopData.address = user.address;
      shopData.verified = true;
      shopData.activated = true;
      shopData.featured = false;

      const schema = Joi.object().keys({
        ownerId: Joi.object().required(),
        name: Joi.string().allow([null, '']).required(),
        email: Joi.string().email().required(),
        phoneNumber: Joi.string().allow([null, '']).optional(),
        address: Joi.string().allow([null, '']).required(),
        verified: Joi.boolean().optional(), 
        activated: Joi.boolean().optional(),
        featured: Joi.boolean().optional(),
      });

      const validate = Joi.validate(shopData, schema);
      if (validate.error) {
        return next(PopulateResponse.validationError(validate.error));
      }

      const shop = new DB.Shop(validate.value);
      shop.location = await Service.Shop.getLocation(shop);
      await shop.save();

      await DB.User.update({ _id: user._id }, {
        $set: {
          isShop: true,
          shopId: shop._id
        }
      });

      if (shop.verified) {
        await Service.Shop.sendEmailApprove(shop);
      }
      await shop.save();
    }
    
    //This is to generate token
    let expireTokenDuration = Math.floor(Date.now() / 1000) + (60 * 15); // 15 minutes

    const autoLoginToken = jwtToken = jwt.sign({
      exp: expireTokenDuration,
      data: {
        shopId: user.shopId,
        email: user.email,
        password: user.password
      }
    }, process.env.SESSION_SECRET);
    
    const update = {
      autoLoginToken: autoLoginToken,
      isShop:true
    };
    
    await DB.User.update({
      _id: user._id
    }, {
      $set: update
    });


    res.locals.token = PopulateResponse.success({
      autoLoginToken: autoLoginToken
    }, 'TOKEN_GENERATED');
    next();
  } catch (e) {
    console.log(e)
    next(e);
  }
};





exports.deleteAutoLoginToken = async (req, res, next) => {
  try {

    const schema = Joi.object().keys({
      token: Joi.string().required(),
    }).unknown();

    const validate = Joi.validate(req.params, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const user = req.params.token ? await DB.User.findOne({ autoLoginToken: req.params.token }) : {};

    const update = {
      autoLoginToken: '',
    };
    await DB.User.update({
      _id: user._id
    }, {
      $set: update
    });

    res.locals.token = PopulateResponse.success({
      success: true
    }, 'TOKEN_REMOVED');
    next();
  } catch (e) {
    next(e);
  }
};
