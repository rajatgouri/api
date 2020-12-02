/* eslint-disable */
module.exports = async () => {
  try {
    const products = await DB.Product.find({ alias: null });
    for (const product of products) {
      let alias = Helper.String.createAlias(product.name);
      const count = await DB.Product.count({
        alias,
        _id: { $ne: product._id }
      });
      if (count) {
        alias = `${alias}-${Helper.String.randomString(5)}`;
      }
      product.alias = alias;
      await product.save();
    }
  } catch (e) {
    throw e;
  }
};
/* eslint-enable */
