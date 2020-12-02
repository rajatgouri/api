/* eslint-disable */
const _ = require('lodash');

module.exports = async () => {
  try {
    const shops = await DB.Shop.find();
    for (const shop of shops) {
      await DB.Product.updateMany({ shopId: shop._id }, {
        $set: {
          shopFeatured: shop.featured,
          shopActivated: shop.activated,
          shopVerified: shop.verified
        }
      });
    }
  } catch (e) {
    throw e;
  }
};
/* eslint-enable */
