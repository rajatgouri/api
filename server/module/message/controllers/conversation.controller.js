/* eslint no-param-reassign: 0 */
const Joi = require('joi');
const _ = require('lodash');

const validateSchema = Joi.object().keys({
  type: Joi.string().allow(['private']).optional().default('private'),
  recipientId: Joi.string().allow([null, '']).optional()
});

/**
 * Create a get room if provided
 */
exports.create = async (req, res, next) => {
  try {
    const validate = Joi.validate(req.body, validateSchema);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    if (req.user._id.toString() === validate.value.recipientId) {
      return next(PopulateResponse.error({
        message: 'Cannot create conversation yourself!'
      }));
    }

    const query = {};
    if (validate.value.type === 'private') {
      query.memberIds = {
        $all: [
          req.user._id,
          Helper.App.toObjectId(validate.value.recipientId)
        ]
      };
    }

    let conservation = await DB.Conversation.findOne(query);
    if (conservation) {
      res.locals.conservation = conservation;
      return next();
    }

    conservation = new DB.Conversation(validate.value);
    conservation.memberIds = [
      req.user._id,
      Helper.App.toObjectId(validate.value.recipientId)
    ];

    await conservation.save();
    res.locals.conservation = conservation;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
    const take = parseInt(req.query.take, 10) || 10;
    const query = {
      memberIds: { $in: [req.user._id] },
      lastMessageId: { $ne: null }
    };

    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.Conversation.count(query);
    const items = await DB.Conversation.find(query)
      .populate('members')
      .populate({
        path: 'lastMessage'
      })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    const senderIds = items.filter(item => item.lastMessage)
      .map(message => message.lastMessage.senderId);
    const senders = !senderIds.length ? [] :
      await DB.User.find({
        _id: { $in: senderIds }
      });

    res.locals.list = {
      count,
      items: items.map((item) => {
        const data = item.toObject();
        data.members = (item.members || []).map(member => member.getPublicProfile());

        if (item.lastMessage) {
          const sender = _.find(senders, s => s._id.toString() === item.lastMessage.senderId.toString());
          data.lastMessage.sender = sender ? sender.getPublicProfile() : null;
        }

        return data;
      })
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.mute = async (req, res, next) => {
  try {
    await DB.Conversation.update({
      _id: req.params.conversationId
    }, {
      $addToSet: {
        muted: req.user._id
      }
    });

    res.locals.mute = { succes: true };
    next();
  } catch (e) {
    next(e);
  }
};

exports.unmute = async (req, res, next) => {
  try {
    await DB.Conversation.update({
      _id: req.params.conversationId
    }, {
      $$pull: {
        muted: req.user._id
      }
    });

    res.locals.unmute = { succes: true };
    next();
  } catch (e) {
    next(e);
  }
};
