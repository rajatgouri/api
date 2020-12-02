exports.auth = async (req, res, next) => {
  try {
    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;
    const presenceData = {
      user_id: req.user._id,
      user_info: req.user.getPublicProfile()
    };

    // TODO -validate me with channel by type

    const data = Service.Pusher.authenticateChannel(socketId, channel, presenceData);
    // must send with ousher format
    res.status(200).send(data);
  } catch (e) {
    next(e);
  }
};
