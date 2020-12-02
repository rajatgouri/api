const _ = require('lodash');

exports.update = async (complainId, data) => {
  try {
    const complain = complainId instanceof DB.Complain ? complainId : await DB.Complain.findOne({ _id: complainId });
    if (!complain) {
      throw PopulateResponse.notFound();
    }

    const oldStatus = complain.status;
    _.merge(complain, data);
    await complain.save();

    if (oldStatus !== complain.status) {
      const user = await DB.User.findOne({ _id: complain.userId });
      if (user) {
        const subject = `Your complain request ${complain.code} has been updated to ${complain.status}`;
        await Service.Mailer.send('complain/notify-user-status-change', user.email, {
          subject,
          user: user.toObject(),
          complain: complain.toObject()
        });
      }
    }

    return complain;
  } catch (e) {
    throw e;
  }
};

exports.create = async (userId, data) => {
  try {
    const user = userId instanceof DB.User ? userId : await DB.User.findOne({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const complain = new DB.Complain({
      userId: user._id,
      content: data.content,
      code: Helper.String.randomString(5).toUpperCase()
    });
    await complain.save();

    await Service.Mailer.send('complain/notify-admin.html', process.env.EMAIL_NOTIFICATION_COMPLAIN, {
      subject: `Complain #${complain.code}`,
      user: user.toObject(),
      complain: complain.toObject()
    });

    await Service.Mailer.send('complain/notify-user.html', user.email, {
      subject: `Complain #${complain.code}`,
      user: user.toObject(),
      complain: complain.toObject()
    });

    return complain;
  } catch (e) {
    throw e;
  }
};
