/* eslint import/no-extraneous-dependencies: 0, no-restricted-syntax: 0, no-await-in-loop: 0 */

module.exports = async () => {
  try {
    const users = await DB.User.find({ role: 'admin' });
    for (const user of users) {
      user.password = '123456';
      await user.save();
    }
  } catch (e) {
    console.log(e);
    process.exit();
  }
};
