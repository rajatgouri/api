const Pusher = require('pusher');
const Queue = require('../../../kernel/services/queue');

const pusherQ = Queue.create('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  encrypted: false,
  cluster: process.env.PUSHER_CLUSTER
});

pusherQ.process(async (job, done) => {
  try {
    const data = job.data;
    await new Promise(resolve => pusher.trigger(data.channels, data.event, data.data, null, (err) => {
      if (err) {
        console.log('Pusher err', err);
      }

      resolve();
    }));
  } catch (e) {
    // TODO - log error here
    console.log('pusher error', e);
  }

  done();
});

exports.trigger = async (channels, event, data) => pusherQ.createJob({
  channels, event, data
}).save();

exports.emitToChannel = async (channelId, event, data) => {
  const channels = `presence-${channelId}`;
  return pusherQ.createJob({
    channels, event, data
  }).save();
};

exports.authenticateChannel = (socketId, channel, channelData) => pusher.authenticate(socketId, channel, channelData);
