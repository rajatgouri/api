exports.model = {
  Order: require('./models/order'),
  OrderDetail: require('./models/order-details'),
  RefundRequest: require('./models/refund-request'),
  PhoneCheck: require('./models/phone-check'),
  OrderLog: require('./models/order-log')
};

exports.router = (router) => {
  // NOTE - add oder details in order
  require('./routes/order-details')(router);
  require('./routes/order')(router);
  require('./routes/stats.route')(router);
  require('./routes/refund-request.route')(router);
  require('./routes/phone-check.route')(router);
  require('./routes/cart.route')(router);
  require('./routes/import-export.route')(router);
};

exports.services = {
  Order: require('./services/order'),
  Cart: require('./services/cart'),
  Pdf: require('./services/pdf')
};
