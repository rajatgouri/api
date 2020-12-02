
exports.model = {
  Shop: require('./models/shop')
};

exports.mongoosePlugin = require('./mongoosePlugin');

exports.router = (router) => {
  require('./routes/register.route')(router);
  require('./routes/stats.route')(router);
  require('./routes/shop.route')(router);
};

exports.services = {
  Shop: require('./services/Shop')
};
