exports.checkValid = async (shopId, code) => {
  try {
    const coupon = await DB.Coupon.findOne({
      code,
      shopId,
      $or: [{
        expiredTime: null
      }, {
        expiredTime: {
          $gt: new Date()
        }
      }]
    });

    if (!coupon) {
      return false;
    }

    if (coupon.limit && coupon.limit <= coupon.usedCount) {
      return false;
    }
    return coupon;
  } catch (e) {
    return false;
  }
};
