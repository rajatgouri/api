/* eslint no-restricted-syntax: 0, no-await-in-loop: 0 */
module.exports = async () => {
  try {
    const orders = await DB.Order.find();
    for (const order of orders) {
      await DB.OrderDetail.updateMany({
        orderId: order._id
      }, {
        $set: {
          phoneNumber: order.phoneNumber
        }
      });
    }
  } catch (e) {
    throw e;
  }
};
