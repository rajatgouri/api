const Joi = require('joi');
const Queue = require('../queue');

/**
 * Create a new media message
 */
exports.create = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      text: Joi.string().allow([null, '']).optional(),
      fileId: Joi.string().allow([null, '']).optional(),
      conversationId: Joi.string().required(),
      type: Joi.string().allow(['text', 'file']).required()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const conversation = await DB.Conversation.findOne({ _id: validate.value.conversationId });
    if (!conversation) {
      return PopulateResponse.notFound({
        message: 'Conversation not found'
      });
    }

    if (!conversation) {
      return PopulateResponse.notFound({
        message: 'Conversation not found'
      });
    } 

    if(!conversation.lastText) {
      let members = conversation.memberIds;
      members.splice(members.indexOf(req.user._id), 1);

      let sender = await DB.User.findById(req.user._id)
      let reciever = await DB.User.findById(members[0])
      
      reciever = reciever.toObject();
      sender = sender.toObject();
      
      await Service.Mailer.send('messages/notification.html', reciever.email, {
        subject: 'Recieve a new Message',
        sender: sender.name,
        text: req.body.text ? req.body.text : `Recived a new message from ${sender.name}`
      });

      twilio.messages.create({body: 
        `
        You are Receiving a new Message from ${sender.name}

        ${req.body.text}
        `,
        from: nconf.get('SMS_FROM'), to: reciever.phoneNumber})
        .then(message => console.log(message.sid));
    }
    
    const message = new DB.Message(Object.assign(req.body, {
      senderId: req.user._id
    }));
    await message.save();

    Queue.notifyAndUpdateRelationData(message);

    res.locals.create = message;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * get list message
 */
exports.groupMessages = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    // TODO - validate user room
    const query = { };
    if (req.params.conversationId) {
      query.conversationId = req.params.conversationId;
    }

    if (req.query.q) {
      query.text = { $regex: req.query.q.trim(), $options: 'i' };
    }

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Message.count(query);
    const items = await DB.Message.find(query)
      .populate('sender')
      .populate('file')
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.list = {
      count,
      items: items.map((item) => {
        const data = item.toObject();
        data.sender = item.sender ? item.sender.getPublicProfile(true) : null;
        data.file = item.file;
        return data;
      })
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.read = async (req, res, next) => {
  try {
    const validateSchema = Joi.object().keys({
      all: Joi.boolean().optional(),
      conversationId: Joi.string().required()
    });
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const update = validate.value.all ? { $set: { unreadMessage: 0 } } : { $inc: { unreadMessage: -1 } };
    await DB.ConversationUserMeta.update({
      conversationId: validate.value.conversationId,
      userId: req.user._id
    }, update);

    res.locals.read = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const message = await DB.Message.findOne({ _id: req.params.messageId });
    if (!message) {
      return next(PopulateResponse.notFound());
    }

    if (req.user.role !== 'admin' && message.senderId.toString() !== req.user._id.toString()) {
      // TODO - check owner of room, etc...
      return next(PopulateResponse.forbidden());
    }

    await message.remove();

    res.locals.remove = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.latest = async (req, res, next) => {
  try {
    const conversations = await DB.Conversation.find({
      memberIds: { $in: [req.user._id] },
      lastMessageId: { $ne: null }
    });
    if (!conversations.length) {
      res.locals.latest = [];
      return next();
    }

    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const query = {
      conversationId: {
        $in: conversations.map(conversation => conversation._id)
      },
      senderId: {
        $ne: req.user._id
      }
    };
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Message.count(query);
    const items = await DB.Message.find(query)
      .populate('sender')
      .populate('file')
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.latest = {
      count,
      items: items.map((item) => {
        const data = item.toObject();
        data.sender = item.sender ? item.sender.getPublicProfile(true) : null;
        data.file = item.file;
        return data;
      })
    };
    return next();
  } catch (e) {
    return next(e);
  }
};
