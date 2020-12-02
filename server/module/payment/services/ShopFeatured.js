const moment = require('moment');

exports.updateFeatured = async (options) => {
  try {
    const query = options.shopId ? { _id: options.shopId } : { ownerId: options.userId };
    const shop = await DB.Shop.findOne(query);
    if (!shop) {
      throw new Error('Shop not found!');
    }
    const featuredPackage = await DB.ShopFeaturedPackage.findOne({ _id: options.packageId });
    if (!featuredPackage) {
      throw new Error('Package not found');
    }
    const expTime = moment(shop.featuredTo).isAfter(new Date()) ? moment(shop.featuredTo) : moment();
    shop.featured = true;
    shop.featuredTo = expTime.add(featuredPackage.numDays, 'days').toDate();
    await shop.save();

    // TODO - mailing here
    await Service.Mailer.send('shop/featured-shop-pay-success.html', shop.email, {
      subject: 'Payment for featured shop is success',
      shop: shop.toObject(),
      featuredTo: expTime.format('DD/MM/YYYY')
    });
    return true;
  } catch (e) {
    throw e;
  }
};
