exports.model = {
  Report: require('./models/report')
};

exports.router = (router) => {
  require('./routes/report.route')(router);
};
