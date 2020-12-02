/* eslint no-param-reassign: 0 */
const Joi = require('joi');
const _ = require('lodash');

const validateSchema = Joi.object().keys({
  productId: Joi.string().required()
});

exports.findOne = async (req, res, next) => {
  try {
    const wishlist = await DB.Wishlist.findOne({ _id: req.params.wishlistId })
      .populate('user')
      .populate('wishlist');
    if (!wishlist) {
      return res.status(404).send(PopulateResponse.notFound());
    }

    req.wishlist = wishlist;
    res.locals.wishlist = wishlist;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * Create a new withlist
 */
exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    let wishlist = await DB.Wishlist.findOne({
      userId: req.user._id,
      productId: validate.value.productId
    });
    if (wishlist) {
      return next(PopulateResponse.error({
        message: 'This product has been added to your wishlist'
      }));
      // res.locals.wishlist = wishlist;
    }

    wishlist = new DB.Wishlist(Object.assign(validate.value, {
      userId: req.user._id
    }));
    await wishlist.save();
    res.locals.wishlist = wishlist;

    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.wishlist.userId.toString()) {
      return next(PopulateResponse.forbidden());
    }

    await req.wishlist.remove();
    res.locals.remove = {
      message: 'Wishlist is deleted'
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * get list wishlist
 */
exports.list = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    const query = {
      userId: req.user._id
    };

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Wishlist.count(query);
    const wishlist = await DB.Wishlist.find(query)
      .populate('user')
      .populate('product')
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();
    const items = wishlist.map((item) => {
      const data = item.toObject();
      if (item.user) {
        data.user = item.user.getPublicProfile();
      }
      data.product = item.product.toObject();

      return data;
    });
    const imageIds = items.filter(item => item.product)
      .filter(item => item.product.mainImage)
      .map(item => item.product.mainImage);

    if (imageIds && imageIds.length) {
      const images = await DB.Media.find({ _id: { $in: imageIds } });
      items.forEach((item) => {
        if (item.product && item.product.mainImage) {
          const image = _.find(images, img => img._id.toString() === item.product.mainImage.toString());
          if (image) {
            item.product.mainImage = image.getPublic();
          }
        }
      });
    }

    const shopIds = items.filter(item => item.product.shopId)
      .map(item => item.product.shopId);
    if (shopIds && shopIds.length) {
      const shops = await DB.Shop.find({ _id: { $in: shopIds } });
      items.forEach((item) => {
        if (item.product && item.product.shopId) {
          const shop = _.find(shops, s => s._id.toString() === item.product.shopId.toString());
          if (shop) {
            item.product.shop = _.pick(shop, [
              '_id', 'ownerId', 'name', 'alias', 'email', 'phoneNumber', 'address', 'returnAddress'
            ]);
          }
        }
      });
    }

    res.locals.list = {
      count,
      items
    };
    next();
  } catch (e) {
    next(e);
  }
};
