
exports.stats = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role !== 'admin' || req.headers.platform !== 'admin') {
      query.shopId = req.user.shopId;
    }
    const total = await DB.Product.count(query);
    const totalTransaction = await DB.ProductTransactionType.count();


    res.locals.stats = { total, totalTransaction };
    next();
  } catch (e) {
    next(e);
  }
};


