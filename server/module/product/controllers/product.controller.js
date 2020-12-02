const _ = require('lodash');
const Joi = require('joi');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const NodeGeocoder = require('node-geocoder');
 
async function getLocation(zip) {
  const options = {
    provider: 'google',
   
    // Optional depending on the providers
    apiKey: process.env.GOOGLE_GEOCODE_API_KEY, // for Mapquest, OpenCage, Google Premier
  };
   
  const geocoder = NodeGeocoder(options);
   
  return await geocoder.geocode(zip);
}

const validateSchema = Joi.object().keys({
  name: Joi.string().required(),
  alias: Joi.string().allow([null, '']).optional(),
  type: Joi.string().allow(['physical', 'digital']).optional(),
  shortDescription: Joi.string().allow([null, '']).optional(),
  description: Joi.string().allow([null, '']).optional(),
  ordering: Joi.number().allow([null, '']).optional(),
  categoryId: Joi.string().allow([null, '']).optional(),
  transactiontypeId: Joi.string().allow([null, '']).optional(),
  shopId: Joi.string().allow([null, '']).optional(),
  userId: Joi.string().allow([null]).optional(),
  token: Joi.string().allow([null]).optional(),
  price: Joi.number().optional(),
  pricePerWeek: Joi.number().allow([null, '']).optional(),
  pricePerMonth: Joi.number().allow([null, '']).optional(),
  startDate: Joi.string().allow([null, '']).optional(),
  endDate: Joi.string().allow([null, '']).optional(),
  salePrice: Joi.number().allow([null]).optional(),
  depositAmont: Joi.number().allow([null, '']).optional(),
  distance: Joi.number().allow([null, '']).optional(),
  mainImage: Joi.string().allow([null, '']).optional(),
  images: Joi.array().items(Joi.string()).optional(),
  zipcode: Joi.string().allow([null, '']).optional(),
  producttypeId: Joi.string().allow([null, '']).optional(),
  publish: Joi.boolean().allow([null]).optional(),
  specifications: Joi.array().items(Joi.object({
    key: Joi.string(),
    value: Joi.any()
  })).optional().default([]),
  featured: Joi.boolean().allow([null]).optional(), // for admin only
  hot: Joi.boolean().allow([null]).optional(), // for admin only
  bestSell: Joi.boolean().allow([null]).optional(), // for admin only
  isActive: Joi.boolean().allow([null]).optional(),
  stockQuantity: Joi.number().optional(),
  sku: Joi.string().allow([null, '']).optional(),
  upc: Joi.string().allow([null, '']).optional(),
  mpn: Joi.string().allow([null, '']).optional(),
  ean: Joi.string().allow([null, '']).optional(),
  jan: Joi.string().allow([null, '']).optional(),
  isbn: Joi.string().allow([null, '']).optional(),
  taxClass: Joi.string().allow([null, '']).optional(),
  taxPercentage: Joi.number().allow([null]).optional(),
  digitalFileId: Joi.string().allow([null, '']).optional(),
  dailyDeal: Joi.boolean().allow([null]).optional(),
  dealTo: Joi.string().allow([null, '']).optional(),
  freeShip: Joi.boolean().allow([null]).optional(),
  notification: Joi.boolean().allow([null]).optional(),
  restrictCODAreas: Joi.array().items(Joi.string()).optional(),
  restrictFreeShipAreas: Joi.array().items(Joi.object().keys({
    areaType: Joi.string().allow(['zipcode', 'city', 'state', 'country']).optional(),
    value: Joi.string(),
    name: Joi.string()
  })).optional(),
  metaSeo: Joi.object().keys({
    keywords: Joi.string().allow([null, '']).optional(),
    description: Joi.string().allow([null, '']).optional()
  }).optional()
});



exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id || req.params.productId || req.body.productId;
    const query = {};
    if (Helper.App.isMongoId(id)) {
      query._id = id;
    } else {
      query.alias = id;
    }
    if (!id) {
      return next(PopulateResponse.validationError());
    }
    const product = await DB.Product.findOne(query);
    if (!product) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    req.product = product;
    res.locals.product = product;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.publish = async (req, res, next) => {
  
  const validateSchema = Joi.object().keys({
    publish: Joi.boolean().optional(),
    productId: Joi.string().required(),
    reasonForNotPublish: Joi.string().allow([null, '']).optional(),
  });

  const validate = Joi.validate(req.body, validateSchema);
  
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }
  
  try {
    const product = await DB.Product.findById(req.body.productId);
    
    if(!product) {
      return next(PopulateResponse.error({
        message: 'This Product was not found'
      }, 'ERR_PRODUCT_INVALID'));
    }

    product.publish = req.body.publish? req.body.publish : false;
    product.reasonForNotPublish = req.body.reasonForNotPublish ? req.body.reasonForNotPublish : '';
    
    await product.save();
    res.locals.publish = {
      status: true
    };
    return next();
  } catch (e) {
    return next(e);
  }
};


/**
 * Create a new media product
 */
exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    let alias = req.body.alias ? Helper.String.createAlias(req.body.alias) : Helper.String.createAlias(req.body.name);
    const count = await DB.Product.count({ alias });
    if (count) {
      alias = `${alias}-${Helper.String.randomString(5)}`;
    }

    if (req.user.role !== 'admin') {
      validate.value = _.omit(validate.value, [
        'featured', 'hot', 'bestSell'
      ]);
    }

    let location = await getLocation(req.body.zipcode)

    if(!location) {
      return next(PopulateResponse.error({
        message: 'This Zip code is Invalid'
      }, 'ERR_ZIPCODE_INVALID'));
    }

    validate.value['location'] = {
      "type": "Point",
      "coordinates":[location[0].latitude, location[0].longitude],
      "country": location[0].country,
      "countryCode": location[0].countryCode,
      "zipcode": location[0].zipcode
    }
    
    validate.value['publish'] = true;
    Helper.Utils.markNullEmpty(validate.value, ['categoryId']);
    const product = new DB.Product(Object.assign(validate.value, {
      alias,
      createdBy: req.user._id,
      updatedBy: req.user._id,
      shopId: req.user.role === 'admin' ? req.body.shopId : req.user.shopId,
      currency: process.env.SITE_CURRENCY
    }));

    

    product.discounted = product.salePrice < product.price;
    await product.save();
    res.locals.product = await Service.Product.updateShopStatus(product);
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
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    let alias = req.body.alias ? Helper.String.createAlias(req.body.alias) : Helper.String.createAlias(req.body.name);
    const count = await DB.Product.count({
      alias,
      _id: { $ne: req.product._id }
    });
    if (count) {
      alias = `${alias}-${Helper.String.randomString(5)}`;
    }

    Helper.Utils.markNullEmpty(validate.value, ['categoryId']);
    _.assign(req.product, validate.value, {
      updatedBy: req.user._id
    });

    req.product.discounted = req.product.salePrice < req.product.price;
    if(!req.product.startDate){
      req.product.startDate = '';
    }
    if(!req.product.endDate){
      req.product.endDate = '';
    }

    let location = await getLocation(req.body.zipcode)
    if(location.length < 1) {
      return next(PopulateResponse.error({
        message: 'This Zip code is Invalid'
      }, 'ERR_ZIPCODE_INVALID'));
    }

    req.product['location'] = {
      "type": "Point",
      "coordinates":[location[0].latitude, location[0].longitude],
      "country": location[0].country,
      "countryCode": location[0].countryCode,
      "zipcode": location[0].zipcode
    }
    
    await req.product.save();
    res.locals.update = await Service.Product.updateShopStatus(req.product);
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await req.product.remove();
    // TODO - update cound

    res.locals.remove = {
      message: 'Product is deleted'
    };
    next();
  } catch (e) {
    next(e);
  }
};

const validateAreaAvailabilitySchema = Joi.object().keys({
  coordinates: Joi.array().items(Joi.number()).required(),
  zipcode: Joi.string().allow([null, '']).required(),
  distance:Joi.allow([null, '']).optional(), 
});


exports.areaAvailability = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateAreaAvailabilitySchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    let zipcode = req.body.zipcode;
    let coordinates = req.body.coordinates;
    let distance = +req.body.distance;

    let location = await getLocation(zipcode);
    let calculatedDistance = 0;

    if(location.length < 1) {
      return next(PopulateResponse.error({
        message: 'This Zip code is not Valid'
      }, 'ERR_ZIPCODE_INVALID'));
    }
    
    if ((+location[0].latitude == +coordinates[0]) && (+location[0].longitude == +coordinates[1])) {
      calculatedDistance = 0;
    }
    else {
      var radlat1 = Math.PI * +location[0].latitude/180;
      var radlat2 = Math.PI * +coordinates[0]/180;
      var theta = +location[0].longitude- +coordinates[1];
      var radtheta = Math.PI * theta/180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515;
      dist = dist * 1.609344 
      calculatedDistance = dist;
    }

    let result = ((distance? distance : Infinity ) > calculatedDistance ? {code: 200, msg: 'Deliverable'}: {code: 400, msg: 'NOT Deliverable'});
    
    res.locals.distance = {
      distance: result
    };
    next();
  } catch (e) {
    console.log(e)
    next(e);
  }
};

/**
 * get list product
 */
exports.search = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    let query = Helper.App.populateDbQuery(req.query, {
      text: ['name', 'alias', 'shortDescription'],
      boolean: ['featured', 'isActive', 'hot', 'bestSell', 'dailyDeal', 'discounted', 'soldOut']
    });

    //This is for transaction type id
    if (req.query.transactiontypeId) {
      const transactionType = await DB.ProductTransactionType.findOne({_id:req.query.transactiontypeId});
      if(transactionType.name == 'Buy'){
        query.$or = [{transactiontypeId: req.query.transactiontypeId}, {transactiontypeId: null}];
      } else {
        query.transactiontypeId = req.query.transactiontypeId;
      }
      /*query.transactiontypeId = {
        $in: !root ? [category._id] : Helper.Utils.flatten(root).map(item => item._id)
      };*/
    }

    if (req.query.categoryId) {
      // TODO - optimize me by check in the cache
      const categories = await DB.ProductCategory.find();
      const category = categories.find(item => ([item.alias, item._id.toString()].indexOf(req.query.categoryId)) > -1);
      if (category) {
        const tree = Helper.Utils.unflatten(categories.map(c => c.toJSON()));
        const root = Helper.Utils.findChildNode(tree, category._id);

        query.categoryId = {
          $in: !root ? [category._id] : Helper.Utils.flatten(root).map(item => item._id)
        };
      }
    }

    let defaultSort = true;
    if (['seller', 'admin'].indexOf(req.headers.platform) === -1) {
      query.isActive = true;
      query.shopVerified = true;
      query.shopActivated = true;
      defaultSort = false;
    } else if (req.headers.platform === 'seller' && req.user && req.user.isShop) {
      // from seller platform, just show seller products
      query.shopId = req.user.shopId;
    }

    if (req.headers.platform !== 'seller' && req.query.shopId) {
      query.shopId = Helper.App.toObjectId(req.query.shopId);
    }

    if (req.query.q) {
      req.query.q = decodeURIComponent(req.query.q).trim();
      req.query.q = req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: req.query.q.trim(), $options: 'i' };
    }

    if (query.dailyDeal && ['false', '0'].indexOf(query.dailyDeal) === -1) {
      query.dailyDeal = true;
    }

    //this is for start date
    let queryStartDate = {};
    if(req.query.startDate){
      queryStartDate = {$or:[
        {startDate:null},
        {startDate:''},
        {startDate:{
          "$lte": new Date(req.query.startDate)
        }}
      ]};
    }
    let queryEndDate = {};
    if(req.query.endDate){
      queryEndDate = {$or:[
        {endDate:null},
        {endDate:''},
        {endDate:{
          "$gte": new Date(req.query.endDate)
        }}
      ]};
    }
    query.$and = [queryStartDate, queryEndDate];
    
    const sort = Object.assign(Helper.App.populateDBSort(req.query), defaultSort ? {} : {
      shopFeatured: -1
    });

    if (req.query.sort === 'random') {
      const randomData = await DB.Product.aggregate([{
        $match: query
      }, {
        $sample: { size: take }
      }, {
        $project: { _id: 1 }
      }]);
      if (randomData && randomData.length) {
        query = {
          _id: {
            $in: randomData.map(p => p._id)
          }
        };
      }
    }

    if(req.query.geo) {
      query.location = { 
        $near: {
            $geometry: { type: "Point",  coordinates: [+req.query.lat, +req.query.lng]}, 
            $maxDistance: +req.query.maxDistance * 0.000621371, //miles
          }
      }
    }
        

    const count = await DB.Product.count(query);
    const items = await DB.Product.find(query)
      .populate({
        path: 'mainImage',
        select: '_id filePath mediumPath thumbPath uploaded type'
      })
      .populate({
        path: 'category',
        select: '_id name mainImage totalProduct parentId'
      })
      .populate({
        path: 'transactiontype',
        select: '_id name'
      })
      
      .populate('shop')
      .collation({ locale: 'en' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.search = {
      count,
      items
    };
    return next();
  } catch (e) {
    return next(e);
  }
};



exports.details = async (req, res, next) => {
  try {
    const id = req.params.id;
    const query = {};
    if (Helper.App.isMongoId(id)) {
      query._id = id;
    } else {
      query.alias = id;
    }
    const product = await DB.Product.findOne(query)
      .populate({
        path: 'mainImage',
        select: '_id filePath mediumPath thumbPath type uploaed'
      })
      .populate({
        path: 'images',
        select: '_id filePath mediumPath thumbPath type uploaed'
      })
      .populate({
        path: 'category',
        select: '_id name mainImage totalProduct parentId'
      })
      .populate({
        path: 'transactiontype',
        select: '_id name'
      })
      .populate({
        path: 'shop',
        select: '-verificationIssue -bankInfo -verificationIssueId'
      })
      .exec();
    // TODO - should populate product category for the breadcrumbs
    if (!product) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    if (req.user && product.type === 'digital' && product.digitalFileId &&
      (req.user.role === 'admin' || (req.user.isShop && req.user.shopId && req.user.shopId.toString() === product.shopId.toString()))) {
      product.digitalFile = await DB.Media.findOne({ _id: product.digitalFileId });
    }

    req.product = product;
    res.locals.product = product;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.related = async (req, res, next) => {
  try {
    const query = {
      _id: {
        $ne: req.product._id
      },
      isActive: true,
      shopVerified: true,
      shopActivated: true
    };
    if (req.product.categoryId) {
      // TODO - optimize me by check in the cache
      const categories = await DB.ProductCategory.find();
      const category = categories.find(item => ([item.alias, item._id.toString()].indexOf(req.query.categoryId)) > -1);
      if (category) {
        const tree = Helper.Utils.unflatten(categories.map(c => c.toJSON()));
        const root = Helper.Utils.findChildNode(tree, category._id);

        query.categoryId = {
          $in: !root ? [category._id] : Helper.Utils.flatten(root).map(item => item._id)
        };
      }
    }

    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    // change to random
    const randomData = await DB.Product.aggregate([
      { $sample: { size: take } },
      { $project: { _id: 1 } }
    ]);
    if (randomData && randomData.length) {
      query._id = {
        $in: randomData.map(p => p._id)
      };
    }

    const sort = Object.assign({
      shopFeatured: -1
    }, Helper.App.populateDBSort(req.query));
    const items = await DB.Product.find(query)
      .populate({
        path: 'mainImage',
        select: '_id filePath mediumPath thumbPath uploaded type'
      })
      .populate({
        path: 'category',
        select: '_id name mainImage totalProduct parentId'
      })
      .populate('shop')
      .collation({ locale: 'en' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();
    res.locals.items = items;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.checkAlias = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      alias: Joi.string().required()
    });
    const validate = Joi.validate(req.body, schema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    const alias = Helper.String.createAlias(validate.value.alias);
    const count = await DB.Product.findOne({ alias });
    res.locals.checkAlias = {
      exist: count > 0
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.availability = async(req, res, next) => {
  

  let productAvailable = false;
  const schema = Joi.object().keys({
    alias: Joi.string().required(),
    startDate: Joi.string().allow([null, '']).optional(),
    endDate: Joi.string().allow([null, '']).optional(),
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }
  
  if(!req.body.alias){
    return next(e);
  }

  const query = {
    alias: req.body.alias
  };

  let date = new Date(req.body.startDate);
  query.startDate = {
    "$lte": moment(req.body.startDate).format('YYYY-MM-DD[T00:00:00.000Z]')
  };
  query.$or = [
    {endDate:null},
    {endDate:''},
    {endDate:{
      "$gte": moment(req.body.endDate).format('YYYY-MM-DD[T00:00:00.000Z]')
    }}
  ]
  /*query.endDate = {
    "$gte": moment(req.body.endDate).format('YYYY-MM-DD[T00:00:00.000Z]'), null
  };*/
  
  let product = await DB.Product.findOne(query);
  if(product){
    const orderQuery = {
      productId: product._id
    };

    orderQuery.$or = [
      {startDate:{
        $gte:moment(req.body.startDate).format('YYYY-MM-DD[T00:00:00.000Z]'), $lt:moment(req.body.endDate).format('YYYY-MM-DD[T00:00:00.000Z]')
      }},
      {endDate:{
        $gte:moment(req.body.startDate).format('YYYY-MM-DD[T00:00:00.000Z]'), $lt:moment(req.body.endDate).format('YYYY-MM-DD[T00:00:00.000Z]')
      }},
    ]
    let orderDetails = await DB.OrderDetail.find(orderQuery);
    if(!orderDetails || orderDetails.length === 0) {
      productAvailable = true;
    }
  }
  req.productAvailable = productAvailable;
  res.locals.productAvailable = productAvailable;
  return next();
}

exports.getProductOrders = async(req, res, next) => {
  
  const schema = Joi.object().keys({
    alias: Joi.string().required()
  });

  const validate = Joi.validate(req.body, schema);
  if (validate.error) {
    return next(PopulateResponse.validationError(validate.error));
  }
  
  if(!req.body.alias){
    return next(e);
  }

  const query = {
    alias: req.body.alias
  };

  const product = await DB.Product.findOne(query).populate('transactiontype').exec();
  let orderDetails = {};
  if(product){
    const orderQuery = {"productId": product._id, "paymentStatus":"paid"};
    if(product.transactiontype && (product.transactiontype.name == 'Rent' || product.transactiontype.name == 'Share')){
      orderQuery.$or = [{startDate: {$gte : moment().format('YYYY-MM-DD[T00:00:00.000Z]')}}, {endDate: {$gte : moment().format('YYYY-MM-DD[T00:00:00.000Z]')}}];
    }
    orderDetails = await DB.OrderDetail.find(orderQuery);
  }
  req.orderdetails = orderDetails;
  res.locals.orderdetails = orderDetails;
  return next();
}
