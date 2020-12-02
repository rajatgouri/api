exports.updateTrustedSocialAccount = async (socialAccount) => {
  try {
    const user = await DB.User.findOne({ _id: socialAccount.userId });
    if (!user || !user.shopId) {
      return false;
    }

    const update = {};
    update[`socialConnected.${socialAccount.social}`] = true;
    await DB.Shop.update({ _id: user.shopId }, {
      $set: update
    });
    return true;
  } catch (e) {
    throw e;
  }
};

exports.getLocation = async (shop) => {
  try {
    const address = [
      shop.address || '',
      shop.city || '',
      shop.state || '',
      shop.zipcode || '',
      shop.country || ''
    ].filter(a => a).join(',');
    const data = await Service.Geo.getLocationFromAddress(address);
    return [
      data.longitude || 0,
      data.latitude || 0
    ];
  } catch (e) {
    // throw e;
    return [0, 0];
  }
};

exports.sendEmailApprove = async (shopId) => {
  try {
    const shop = shopId instanceof DB.Shop ? shopId : await DB.Shop.findOne({ _id: shopId });
    if (!shop) {
      throw new Error('Shop not found');
    }

    return Service.Mailer.send('shop/approve-notification.html', shop.email, {
      subject: 'Your shop is now activated',
      shop: shop.toObject(),
      sellerLink: process.env.sellerWebUrl
    });
  } catch (e) {
    throw e;
  }
};

