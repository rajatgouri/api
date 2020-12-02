const Joi = require('joi');
const _ = require('lodash');

exports.getUserShop = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isShop || !req.user.shopId) {
      return next(PopulateResponse.error({
        message: 'You dont have any shop. please try to register'
      }, 'ERR_NO_SHOP'));
    }

    const shop = await DB.Shop.findOne({ _id: req.user.shopId })
      .populate('owner')
      .populate('logo')
      .populate('banner')
      .populate('verificationIssue');

    const data = shop.toObject();
    data.logo = shop.logo;
    data.banner = shop.banner;
    data.verificationIssue = shop.verificationIssue;
    data.owner = shop.owner ? shop.owner.getPublicProfile() : null;

    res.locals.shop = data; // owner can see all information
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.details = async (req, res, next) => {
  try {
    const condition = {};
    if (Helper.App.isObjectId(req.params.shopId)) {
      condition._id = req.params.shopId;
    } else {
      condition.alias = req.params.shopId;
    }

    const query = DB.Shop.findOne(condition)
      .populate('owner')
      .populate('logo')
      .populate('banner');
    const isAdmin = req.user && req.user.role === 'admin';
    if (isAdmin) {
      query.populate('verificationIssue');
    }
    const shop = await query.exec();

    const data = shop.toObject();
    data.owner = shop.owner ? shop.owner.getPublicProfile() : null;
    data.logo = shop.logo;
    data.banner = shop.banner;
    data.verificationIssue = shop.verificationIssue;

    if (!shop) {
      return next(PopulateResponse.notFound());
    }

    res.locals.shop = data;
    return next();
  } catch (e) {
    return next(e);
  }
};


exports.search = async (req, res, next) => {
  // TODO - define me
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'address', 'city', 'state', 'zipcode', 'returnAddress', 'email'],
      boolean: isAdmin ? ['verified', 'activated', 'featured'] : ['featured'],
      equal: ['ownerId']
    });

    // TODO - define platform (admin or seller or user) here
    let defaultSort = true;
    if (!isAdmin) {
      query.verified = true;
      query.activated = true;
      defaultSort = false;
    }

    if (req.query.q) {
      query.name = { $regex: req.query.q.trim(), $options: 'i' };
    }
    const sort = Object.assign(defaultSort ? {} : { featured: -1 }, Helper.App.populateDBSort(req.query));
    const lat = parseFloat(req.query.latitude);
    const lng = parseFloat(req.query.longitude);
    // The latitude must be a number between -90 and 90 and the longitude between -180 and 180.
    if (lat && lng && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const distance = parseFloat(req.query.distance);
      query.location = {
        $nearSphere: [parseFloat(req.query.longitude), parseFloat(req.query.latitude)]
      };
      if (distance) {
        // in km
        // https://stackoverflow.com/questions/12180290/convert-kilometers-to-radians
        query.location.$maxDistance = distance / 6371;
      }
    }

    const count = await DB.Shop.count(query);
    if (req.query.sort === 'random') {
      const randomData = await DB.Shop.aggregate([
        { $match: query },
        { $sample: { size: take } },
        { $project: { _id: 1 } }
      ]);
      if (randomData && randomData.length) {
        query._id = {
          $in: randomData.map(p => p._id)
        };
      }
    }

    const queryItems = DB.Shop.find(query)
      .collation({ locale: 'en' })
      .populate('owner')
      .populate('logo')
      .populate('banner');
    if (isAdmin) {
      queryItems.populate('verificationIssue');
    }

    const items = await (query.location ? queryItems : queryItems.sort(sort))
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.search = {
      count,
      items: items.map((item) => {
        const data = item.toObject();
        data.logo = item.logo;
        data.banner = item.banner;
        data.verificationIssue = item.verificationIssue;
        data.owner = item.owner ? item.owner.getPublicProfile() : null;
        return data;
      })
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      ownerId: Joi.string().required(),
      name: Joi.string().allow([null, '']).required(),
      alias: Joi.string().allow([null, '']).optional(),
      email: Joi.string().email().required(),
      phoneNumber: Joi.string().allow([null, '']).optional(),
      address: Joi.string().required(),
      city: Joi.string().allow([null, '']).optional(),
      state: Joi.string().allow([null, '']).optional(),
      country: Joi.string().allow([null, '']).optional(),
      zipcode: Joi.string().allow([null, '']).optional(),
      shopType: Joi.string().allow([null, '']).optional(),
      returnAddress: Joi.string().allow([null, '']).optional(),
      location: Joi.array().items(Joi.number()).length(2).optional(), // [longitude, latitude]
      verificationIssueId: Joi.string().allow([null, '']).optional(),
      businessInfo: Joi.object().keys({
        name: Joi.string().allow([null, '']).optional(),
        identifier: Joi.string().allow([null, '']).optional(),
        address: Joi.string().allow([null, '']).optional()
      }).optional(),
      bankInfo: Joi.object().keys({
        bankName: Joi.string().allow([null, '']).optional(),
        swiftCode: Joi.string().allow([null, '']).optional(),
        bankId: Joi.string().allow([null, '']).optional(),
        bankBranchId: Joi.string().allow([null, '']).optional(),
        bankBranchName: Joi.string().allow([null, '']).optional(),
        accountNumber: Joi.string().allow([null, '']).optional(),
        accountName: Joi.string().allow([null, '']).optional()
      }).optional(),
      socials: Joi.object().keys({
        facebook: Joi.string().allow([null, '']).optional(),
        twitter: Joi.string().allow([null, '']).optional(),
        google: Joi.string().allow([null, '']).optional(),
        linkedin: Joi.string().allow([null, '']).optional(),
        youtube: Joi.string().allow([null, '']).optional(),
        instagram: Joi.string().allow([null, '']).optional(),
        flickr: Joi.string().allow([null, '']).optional()
      }).optional(),
      socialConnected: Joi.object().keys({
        facebook: Joi.boolean().optional(),
        twitter: Joi.boolean().optional(),
        google: Joi.boolean().optional(),
        linkedin: Joi.boolean().optional()
      }).optional(),
      logoId: Joi.string().allow([null, '']).optional(),
      bannerId: Joi.string().allow([null, '']).optional(),
      verified: Joi.boolean().optional().default(true), // valid with admin only
      activated: Joi.boolean().optional(), // valid with admin only
      featured: Joi.boolean().optional(), // valid with admin only
      featuredTo: Joi.string().optional(), // valid with admin only
      gaCode: Joi.string().allow([null, '']).optional(),
      headerText: Joi.string().allow([null, '']).optional(),
      notifications: Joi.object().keys({
        lowInventory: Joi.boolean().optional()
      }).optional(),
      storeWideShipping: Joi.boolean().optional(),
      shippingSettings: Joi.object().keys({
        defaultPrice: Joi.number().optional(),
        perProductPrice: Joi.number().optional(),
        perQuantityPrice: Joi.number().optional(),
        processingTime: Joi.string().optional(),
        shippingPolicy: Joi.string().optional(),
        refundPolicy: Joi.string().optional(),
        shipFrom: Joi.string().optional(),
      }).optional(),
      announcement: Joi.string().allow([null, '']).optional()
    });
    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    console.log('hello');
    
    const user = await DB.User.findOne({ _id: validate.value.ownerId });
    if (!user) {
      return next(PopulateResponse.error({
        message: 'User is not exist'
      }));
    }
    if (user.isShop) {
      return next(PopulateResponse.error({
        message: 'This account has already registered with a shop!'
      }, 'ERR_ACCOUNT_HAVE_SHOP'));
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

    res.locals.create = shop;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      name: Joi.string().allow([null, '']).optional(),
      alias: Joi.string().allow([null, '']).optional(),
      email: Joi.string().email().optional(),
      phoneNumber: Joi.string().allow([null, '']).optional(),
      address: Joi.string().allow([null, '']).optional(),
      city: Joi.string().allow([null, '']).optional(),
      state: Joi.string().allow([null, '']).optional(),
      country: Joi.string().allow([null, '']).optional(),
      zipcode: Joi.string().allow([null, '']).optional(),
      shopType: Joi.string().allow([null, '']).optional(),
      returnAddress: Joi.string().allow([null, '']).optional(),
      location: Joi.array().items(Joi.number()).length(2).optional(), // [longitude, latitude]
      verificationIssueId: Joi.string().allow([null, '']).optional(),
      businessInfo: Joi.object().keys({
        name: Joi.string().allow([null, '']).optional(),
        identifier: Joi.string().allow([null, '']).optional(),
        address: Joi.string().allow([null, '']).optional()
      }).optional(),
      bankInfo: Joi.object().keys({
        bankName: Joi.string().allow([null, '']).optional(),
        swiftCode: Joi.string().allow([null, '']).optional(),
        bankId: Joi.string().allow([null, '']).optional(),
        bankBranchId: Joi.string().allow([null, '']).optional(),
        bankBranchName: Joi.string().allow([null, '']).optional(),
        accountNumber: Joi.string().allow([null, '']).optional(),
        accountName: Joi.string().allow([null, '']).optional()
      }).optional(),
      socials: Joi.object().keys({
        facebook: Joi.string().allow([null, '']).optional(),
        twitter: Joi.string().allow([null, '']).optional(),
        google: Joi.string().allow([null, '']).optional(),
        linkedin: Joi.string().allow([null, '']).optional(),
        youtube: Joi.string().allow([null, '']).optional(),
        instagram: Joi.string().allow([null, '']).optional(),
        flickr: Joi.string().allow([null, '']).optional()
      }).optional(),
      socialConnected: Joi.object().keys({
        facebook: Joi.boolean().optional(),
        twitter: Joi.boolean().optional(),
        google: Joi.boolean().optional(),
        linkedin: Joi.boolean().optional()
      }).optional(),
      logoId: Joi.string().allow([null, '']).optional(),
      bannerId: Joi.string().allow([null, '']).optional(),
      verified: Joi.boolean().optional(), // valid with admin only
      activated: Joi.boolean().optional(), // valid with admin only
      featured: Joi.boolean().optional(), // valid with admin only
      featuredTo: Joi.string().optional(), // valid with admin only
      gaCode: Joi.string().allow([null, '']).optional(),
      headerText: Joi.string().allow([null, '']).optional(),
      notifications: Joi.object().keys({
        lowInventory: Joi.boolean().optional()
      }).optional(),
      storeWideShipping: Joi.boolean().optional(),
      shippingSettings: Joi.object().keys({
        defaultPrice: Joi.number().optional(),
        perProductPrice: Joi.number().optional(),
        perQuantityPrice: Joi.number().optional(),
        processingTime: Joi.string().optional(),
        shippingPolicy: Joi.string().optional(),
        refundPolicy: Joi.string().optional(),
        shipFrom: Joi.string().optional(),
      }).optional(),
      announcement: Joi.string().allow([null, '']).optional()
    });

    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const shop = await DB.Shop.findOne({ _id: req.params.shopId });
    if (shop.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(PopulateResponse.forbidden());
    }

    const sendMailApprove = !shop.verified && req.user.role === 'admin' && validate.value.verified;
    const value = req.user.role !== 'admin' ? _.omit(validate.value, ['verified', 'activated', 'featured']) : validate.value;
    _.merge(shop, value);
    shop.location = await Service.Shop.getLocation(shop);
    await shop.save();

    const user = await DB.User.findOne({ _id: shop.ownerId });

    if(user) {
      user.phoneNumber = shop.phoneNumber;
      await user.save();
    }

    if (sendMailApprove) {
      await Service.Shop.sendEmailApprove(shop);
    }
    res.locals.update = shop;
    return next();
  } catch (e) {
    return next(e);
  }
};
