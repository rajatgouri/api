exports.model = {
  Device: require('./models/device')
};

exports.services = {
  Pusher: require('./services/Pusher'),
  Sms: require('./services/Sms')
};

exports.router = (router) => {
  require('./routes/pusher.route')(router);
  require('./routes/device.route')(router);
};
