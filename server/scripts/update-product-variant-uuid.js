/* eslint-disable */
module.exports = async () => {
  try {
    const variants = await DB.ProductVariant.find();
    for (const variant of variants) {
      await variant.save();
    }
  } catch (e) {
    throw e;
  }
};
/* eslint-enable */
