exports.model = {
  Coupon: require('./models/coupon')
};

exports.router = (router) => {
  require('./routes/coupon.route')(router);
};

exports.services = {
  Coupon: require('./services/coupon')
};
