const Queue = require('../../kernel/services/queue');
const _ = require('lodash');

const messageQ = Queue.create('message');

messageQ.process(async (job, done) => {
  try {
    const message = job.data.message;
    // notify to presence channel group
    if (message.fileId) {
      const file = await DB.Media.findOne({ _id: message.fileId });
      if (file) {
        message.file = file.toJSON();
      }
    }

    const pnData = message;
    // send message to user in the channel
    const conversation = await DB.Conversation.findOne({ _id: message.conversationId });
    const mute = conversation.mute || [];
    if (!conversation) {
      return done();
    }

    let userIds = [];
    if (conversation.type === 'private') {
      userIds = conversation.memberIds.filter(memberId => memberId.toString() !== message.senderId.toString())
        .filter(memberId => _.findIndex(mute, u => u.toString() === memberId.toString()) === -1);
    }

    if (userIds.length) {
      // let heading = 'New message';
      const sender = await DB.User.findOne({ _id: message.senderId });
      pnData.sender = sender.getPublicProfile();
      // if (conversation.type === 'private') {
      // heading = sender.name;
      // }

      pnData.uuid = Helper.String.generateUuid();
      // TODO - unblock for PN
      // const text = conversation.type === 'private' ? message.text : `${sender.username}: ${message.text}`;
      // const contents = Helper.String.truncate(text, 50);
      // Service.Pushnotification.push(userIds, heading, contents, pnData);
      // await Service.Pusher.emitToChannel(message.conversationId, 'new_message', pnData);
      await Promise.all(userIds.map(userId => Service.Pusher.trigger(`private-${userId}`, 'new_message', pnData)));
    }

    // update content to conversation
    conversation.lastMessageId = message._id;
    conversation.lastText = message.text;
    await conversation.save();

    // update unread message metadata
    await Promise.all(userIds.map(userId => DB.ConversationUserMeta.update({
      conversationId: conversation._id,
      userId
    }, {
      $set: {
        conversationId: conversation._id,
        userId
      },
      $inc: { unreadMessage: 1 }
    }, {
      upsert: true
    })));
  } catch (e) {
    // TODO - log error here
  }

  return done();
});

exports.notifyAndUpdateRelationData = (message) => {
  const data = message.toObject ? message.toObject() : message;
  messageQ.createJob({ message: data }).save();
};
