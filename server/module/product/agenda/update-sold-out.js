/* eslint prefer-arrow-callback: 0 */
const async = require('async');

module.exports = async (job, done) => {
  try {
    const totalProduct = await DB.Product.count();
    let count = 0;
    const limit = 50;
    let offset = 0;
    async.during(
      function test(cb) {
        cb(null, count < totalProduct);
      },
      async function doQuery() {
        const products = await DB.Product.find().limit(limit).skip(offset);
        await Promise.all(products.map(product => Service.Product.updateSoldOut(product._id)));
        count += limit;
        offset += limit;
      },
      function finishQuery() {
        done();
      }
    );
  } catch (e) {
    done();
  }
};
