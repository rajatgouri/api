const moment = require('moment');

exports.calculateCurrentBalance = async (shopId) => {
  try {
    const codData = await DB.OrderDetail.aggregate([{
      $match: {
        completePayout: false,
        shopId: Helper.App.toObjectId(shopId),
        status: 'completed',
        paymentMethod: 'cod'
      }
    }, {
      $group: {
        _id: null,
        balance: { $sum: '$balance' },
        commission: { $sum: '$commission' },
        total: { $sum: '$totalPrice' }
      }
    }]);
    const codPaymentData = {
      commission: codData && codData.length ? codData[0].commission : 0,
      balance: codData && codData.length ? codData[0].balance : 0,
      total: codData && codData.length ? codData[0].total : 0
    };

    // non COD
    const nonCodData = await DB.OrderDetail.aggregate([{
      $match: {
        completePayout: false,
        shopId: Helper.App.toObjectId(shopId),
        status: 'completed',
        paymentMethod: { $ne: 'cod' }
        // markPayoutRequest: false
      }
    }, {
      $group: {
        _id: null,
        balance: { $sum: '$balance' },
        commission: { $sum: '$commission' },
        total: { $sum: '$totalPrice' }
      }
    }]);

    const nonCodPaymentData = {
      commission: nonCodData && nonCodData.length ? nonCodData[0].commission : 0,
      balance: nonCodData && nonCodData.length ? nonCodData[0].balance : 0,
      total: nonCodData && nonCodData.length ? nonCodData[0].total : 0
    };

    return {
      summary: {
        commission: nonCodPaymentData.commission + codPaymentData.commission,
        balance: nonCodPaymentData.balance - codPaymentData.commission,
        total: nonCodPaymentData.total + codPaymentData.total,
      },
      nonCod: nonCodPaymentData,
      cod: codPaymentData
    };
  } catch (e) {
    throw e;
  }
};

exports.getOrdersForPayout = async (shopId) => {
  try {
    return DB.OrderDetail.find({
      completePayout: false,
      shopId: Helper.App.toObjectId(shopId),
      status: 'completed'
      // paymentMethod: {
      //   $ne: 'cod'
      // }
    });
  } catch (e) {
    throw e;
  }
};

exports.sendRequest = async (shopId, payoutAccount) => {
  try {
    const shop = await DB.Shop.findOne({ _id: shopId });
    if (!shop) {
      throw new Error('Shop not found!');
    }

    // TODO - check previous request
    // if last previous request is still pending, we will alert to admin
    let payoutRequest = await DB.PayoutRequest.findOne({
      status: 'pending',
      shopId
    });
    if (payoutRequest) {
      if (moment(payoutRequest.updatedAt).isAfter(moment().add(-1, 'days'))) {
        if (payoutRequest.requestAttempts >= process.env.MAX_PAYOUT_REQUEST_PER_DAY) {
          throw new Error('Send request reach max attempts today');
        } else {
          payoutRequest.maxAttempts++;
        }
      } else {
        payoutRequest.maxAttempts = 1;
      }
    } else {
      payoutRequest = new DB.PayoutRequest({
        shopId
      });
    }

    const balance = await this.calculateCurrentBalance(shopId);
    if (!balance.summary.balance) {
      throw new Error('Balance is not enough for payout request');
    }
    // create order items on this time frame
    const orders = await this.getOrdersForPayout(shopId);
    if (!orders.length) {
      throw new Error('Balance is not enough for payout request');
    }
    payoutRequest.requestToTime = new Date();
    payoutRequest.total = balance.summary.total;
    payoutRequest.commission = balance.summary.commission;
    payoutRequest.shopBalance = balance.summary.balance;
    payoutRequest.siteBalance = balance.cod.commission;
    payoutRequest.payoutAccount = payoutAccount;
    payoutRequest.details = balance;
    payoutRequest.nonCodBalance = balance.nonCod.balance;
    payoutRequest.codBalance = balance.cod.balance;

    await payoutRequest.save();
    // remove previous item then update to this new
    await DB.PayoutItem.remove({ requestId: payoutRequest._id });
    await Promise.all(orders.map((order) => {
      const payoutItem = new DB.PayoutItem({
        requestId: payoutRequest._id,
        itemType: 'order',
        itemId: order._id,
        total: order.totalPrice,
        commission: order.commission,
        balance: order.balance,
        shopId: order.shopId
      });

      return payoutItem.save();
    }));

    // send email to admin
    await Service.Mailer.send('payout/request-to-admin.html', process.env.EMAIL_NOTIFICATION_PAYOUT_REQUEST, {
      subject: `Payout request from ${shop.name}`,
      shop: shop.toObject(),
      orders,
      payoutRequest
    });
    return payoutRequest;
  } catch (e) {
    throw e;
  }
};

exports.approveRequest = async (requestId, options) => {
  try {
    const payoutRequest = requestId instanceof DB.PayoutRequest ? requestId : await DB.PayoutRequest.findOne({ _id: requestId });
    if (!payoutRequest) {
      throw new Error('Request not found');
    }

    if (payoutRequest.status === 'approved') {
      throw new Error('Payout request status is invalid');
    }

    payoutRequest.status = 'approved';
    if (options.note) {
      payoutRequest.note = options.note;
    }
    await payoutRequest.save();
    await DB.PayoutItem.updateMany({ requestId: payoutRequest._id }, {
      status: 'approved'
    });
    const payoutItems = await DB.PayoutItem.find({ requestId: payoutRequest._id });
    await Promise.all(payoutItems.map(payoutItem => DB.OrderDetail.update({ _id: payoutItem.itemId }, {
      $set: {
        completePayout: true,
        payoutRequestId: payoutItem.requestId
      }
    })));
    const shop = await DB.Shop.findOne({ _id: payoutRequest.shopId });
    await Service.Mailer.send('payout/approve-notify-to-shop.html', shop.email, {
      subject: `Payout request #${payoutRequest.code} is approved`,
      shop: shop.toObject(),
      payoutRequest
    });
    return payoutRequest;
  } catch (e) {
    throw e;
  }
};

exports.rejectRequest = async (requestId, options) => {
  try {
    const payoutRequest = requestId instanceof DB.PayoutRequest ? requestId : await DB.PayoutRequest.findOne({ _id: requestId });
    if (!payoutRequest) {
      throw new Error('Request not found');
    }

    if (payoutRequest.status === 'approved') {
      throw new Error('Payout request status is invalid');
    }

    payoutRequest.status = 'rejected';
    if (options.rejectReason) {
      payoutRequest.rejectReason = options.rejectReason;
    }
    if (options.note) {
      payoutRequest.note = options.note;
    }
    await payoutRequest.save();
    await DB.PayoutItem.updateMany({ requestId: payoutRequest._id }, {
      status: 'rejected'
    });
    const shop = await DB.Shop.findOne({ _id: payoutRequest.shopId });
    await Service.Mailer.send('payout/reject-notify-to-shop.html', shop.email, {
      subject: `Payout request #${payoutRequest.code} is rejected`,
      shop: shop.toObject(),
      payoutRequest
    });
    return payoutRequest;
  } catch (e) {
    throw e;
  }
};

exports.getItemDetails = async (requestId) => {
  try {
    const items = await DB.PayoutItem.find({ requestId });
    // just support order for now
    return Promise.all(items.map(item => DB.OrderDetail.findOne({
      _id: item.itemId
    })));
  } catch (e) {
    throw e;
  }
};

exports.stats = async (options) => {
  try {
    const matchQuery = {};
    if (options.shopId) {
      matchQuery.shopId = Helper.App.toObjectId(options.shopId);
    }
    if (options.startDate && options.toDate) {
      matchQuery.requestToTime = {
        $gte: moment(options.startDate).startOf('day').toDate(),
        $lte: moment(options.toDate).endOf('day').toDate()
      };
    }

    const pendingRequest = await DB.PayoutRequest.aggregate([{
      $match: Object.assign({
        status: 'pending'
      }, matchQuery)
    }, {
      $group: {
        _id: null,
        shopBalance: { $sum: '$shopBalance' },
        commission: { $sum: '$commission' },
        siteBalance: { $sum: '$siteBalance' },
        codBalance: { $sum: '$codBalance' },
        nonCodBalance: { $sum: '$nonCodBalance' }
      }
    }]);
    const approvedRequest = await DB.PayoutRequest.aggregate([{
      $match: Object.assign({
        status: 'approved'
      }, matchQuery)
    }, {
      $group: {
        _id: null,
        shopBalance: { $sum: '$shopBalance' },
        commission: { $sum: '$commission' },
        siteBalance: { $sum: '$siteBalance' },
        codBalance: { $sum: '$codBalance' },
        nonCodBalance: { $sum: '$nonCodBalance' }
      }
    }]);

    return {
      pending: {
        shopBalance: pendingRequest && pendingRequest.length ? pendingRequest[0].shopBalance : 0,
        commission: pendingRequest && pendingRequest.length ? pendingRequest[0].commission : 0,
        siteBalance: pendingRequest && pendingRequest.length ? pendingRequest[0].siteBalance : 0,
        codBalance: pendingRequest && pendingRequest.length ? pendingRequest[0].codBalance : 0,
        nonCodBalance: pendingRequest && pendingRequest.length ? pendingRequest[0].nonCodBalance : 0
      },
      approved: {
        shopBalance: approvedRequest && approvedRequest.length ? approvedRequest[0].shopBalance : 0,
        commission: approvedRequest && approvedRequest.length ? approvedRequest[0].commission : 0,
        siteBalance: approvedRequest && approvedRequest.length ? approvedRequest[0].siteBalance : 0,
        codBalance: approvedRequest && approvedRequest.length ? approvedRequest[0].codBalance : 0,
        nonCodBalance: approvedRequest && approvedRequest.length ? approvedRequest[0].nonCodBalance : 0
      }
    };
  } catch (e) {
    throw e;
  }
};
