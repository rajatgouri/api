exports.model = {
  Complain: require('./models/complain')
};

exports.router = (router) => {
  require('./routes/complain.route')(router);
};

exports.services = {
  Complain: require('./services/Complain')
};
