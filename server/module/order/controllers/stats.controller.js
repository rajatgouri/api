exports.stats = async (req, res, next) => {
  try {
    const statuses = ['pending', 'progressing', 'shipping', 'completed', 'refunded', 'cancelled'];
    const promises = statuses.map((status) => {
      const query = {
        status,
        $or: [{
          paymentStatus: 'paid',
          paymentMethod: { $ne: 'cod' }
        }, {
          paymentMethod: 'cod'
        }]
      };
      if (req.user.role !== 'admin' || req.headers.platform !== 'admin') {
        query.shopId = req.user.shopId;
      } else if (req.user.role === 'admin' && req.query.shopId) {
        query.shopId = req.query.shopId;
      }
      return DB.OrderDetail.count(query)
        .then(count => ({ count, status }));
    });

    const data = await Promise.all(promises);
    const result = {};
    let count = 0;
    data.forEach((item) => {
      count += item.count;
      result[item.status] = item.count;
    });
    result.all = count;
    // count total if user is admin
    if (req.user.role === 'admin') {
      result.totalParentOrder = await DB.Order.count({
        $or: [{
          paymentStatus: 'paid',
          paymentMethod: { $ne: 'cod' }
        }, {
          paymentMethod: 'cod'
        }]
      });
    }

    res.locals.stats = result;
    next();
  } catch (e) {
    next(e);
  }
};

exports.saleStats = async (req, res, next) => {
  try {
    const query = {
      $or: [{
        paymentStatus: 'paid',
        paymentMethod: { $ne: 'cod' }
      }, {
        paymentMethod: 'cod'
      }],
      status: 'completed'
    };
    if (req.user.role !== 'admin' || req.headers.platform !== 'admin') {
      query.shopId = req.user.shopId;
    } else if (req.user.role === 'admin' && req.query.shopId && Helper.App.isMongoId(req.query.shopId)) {
      query.shopId = Helper.App.toObjectId(req.query.shopId);
    }
    const data = await DB.OrderDetail.aggregate([{
      $match: query
    }, {
      $group: {
        _id: null,
        balance: { $sum: '$balance' },
        commission: { $sum: '$commission' },
        totalPrice: { $sum: '$totalPrice' },
        taxPrice: { $sum: '$taxPrice' },
        totalProduct: { $sum: '$quantity' },
        totalOrder: { $sum: 1 }
      }
    }]);
    const result = {
      balance: 0,
      commission: 0,
      totalPrice: 0,
      taxPrice: 0,
      totalProduct: 0,
      totalOrder: 0
    };
    if (data && data.length) {
      result.balance = data[0].balance;
      result.commission = data[0].commission;
      result.totalPrice = data[0].totalPrice;
      result.taxPrice = data[0].taxPrice;
      result.totalProduct = data[0].totalProduct;
      result.totalOrder = data[0].totalOrder;
    }

    res.locals.saleStats = result;
    next();
  } catch (e) {
    next(e);
  }
};
