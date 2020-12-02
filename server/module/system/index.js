exports.model = {
  Config: require('./models/config')
};

exports.router = (router) => {
  require('./routes/config.route')(router);
  require('./routes/contact.route')(router);
};

exports.services = {
  Geo: require('./services/geo')
};
