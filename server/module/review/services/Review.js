exports.canReview = async (customerId, options) => {
  try {
    const query = { customerId };
    if (options.type === 'product') {
      query.productId = options.productId;
    } else if (options.type === 'shop') {
      query.shopId = options.shopId;
    } else {
      return false;
    }

    const count = await DB.OrderDetail.count(query);
    return count > 0;
  } catch (e) {
    throw e;
  }
};

exports.updateReviewScoreProduct = async (productId) => {
  try {
    const data = await DB.Review.aggregate([{
      $match: {
        productId: Helper.App.toObjectId(productId)
      }
    }, {
      $group: {
        _id: null,
        sum: { $sum: '$rating' },
        count: { $sum: 1 }
      }
    }]).exec();

    if (!data || !data.length) {
      return false;
    }

    const sum = data[0].sum;
    const count = data[0].count || 1;
    const avg = Math.round(sum / count, 2);

    return await DB.Product.update({ _id: productId }, {
      $set: {
        ratingAvg: avg,
        totalRating: count,
        ratingScore: sum
      }
    });
  } catch (e) {
    throw e;
  }
};

exports.updateReviewScoreShop = async (shopId) => {
  try {
    const data = await DB.Review.aggregate([{
      $match: {
        shopId: Helper.App.toObjectId(shopId)
      }
    }, {
      $group: {
        _id: null,
        sum: { $sum: '$rating' },
        count: { $sum: 1 }
      }
    }]).exec();

    if (!data || !data.length) {
      return false;
    }

    const sum = data[0].sum;
    const count = data[0].count || 1;
    const avg = Math.round(sum / count, 2);

    return await DB.Shop.update({ _id: shopId }, {
      $set: {
        ratingAvg: avg,
        totalRating: count,
        ratingScore: sum
      }
    });
  } catch (e) {
    throw e;
  }
};

exports.create = async (userId, data) => {
  try {
    const user = userId instanceof DB.User ? userId : await DB.User.findOne({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const canReview = await Service.Review.canReview(user._id, data);
    if (!canReview) {
      throw PopulateResponse.forbidden();
    }

    const review = new DB.Review(Object.assign(data, {
      rateBy: user._id
    }));
    await review.save();
    if (data.type === 'product') {
      await Service.Review.updateReviewScoreProduct(data.productId);
      const product = await DB.Product.findOne({ _id: data.productId });
      if (product) {
        const shop = await DB.Shop.findOne({ _id: product.shopId });
        if (shop) {
          await Service.Mailer.send('review/new-review-product.html', shop.email, {
            subject: `${user.name} has reviewed your product: ${product.name}`,
            review: review.toObject(),
            product: product.toObject(),
            user: user.toObject()
          });
        }
      }
    } else {
      await Service.Review.updateReviewScoreShop(data.shopId);
      const shop = await DB.Shop.findOne({ _id: data.shopId });
      if (shop) {
        await Service.Mailer.send('review/new-review-shop.html', shop.email, {
          subject: `${user.name} has reviewed your shop`,
          review: review.toObject(),
          user: user.toObject(),
          shop: shop.toObject()
        });
      }
    }

    return review;
  } catch (e) {
    throw e;
  }
};

