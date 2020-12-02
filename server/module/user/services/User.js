exports.create = async (data) => {
  try {
    const user = new DB.User(data);
    let sendMailPw = false;
    const password = Helper.String.randomString(5);
    if (!data.password && data.email && user.provider === 'local') {
      user.password = password;
      sendMailPw = true;
    }

    await user.save();
    if (sendMailPw) {
      await Service.Mailer.send('user/new-password-create.html', user.email, {
        subject: 'New password has been created',
        password
      });
    }

    return user;
  } catch (e) {
    throw e;
  }
};
