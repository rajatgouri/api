/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */
module.exports = async () => {
  try {
    const shops = await DB.Shop.find();
    for (const shop of shops) {
      shop.location = await Service.Shop.getLocation(shop);
      await shop.save();
    }
  } catch (e) {
    throw e;
  }
};
