const moment = require('moment');

module.exports = async (job, done) => {
  try {
    await DB.Product.updateMany({
      dailyDeal: true,
      dealTo: { $lt: moment().startOf('day') }
    }, {
      $set: {
        dailyDeal: false
      }
    });
  } catch (e) {
    await Service.Logger.create({
      path: 'update-daily-deal',
      error: e,
      level: 'error'
    });
  }

  done();
};
