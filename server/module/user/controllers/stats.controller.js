exports.stats = async (req, res, next) => {
  try {
    const queries = [{
      name: 'activated',
      query: { isActive: true }
    }, {
      name: 'deactivated',
      query: { isActive: false }
    }];
    const promises = queries.map(query => DB.User.count(query.query)
      .then(count => ({ count, name: query.name })));
    const data = await Promise.all(promises);
    const result = {};
    data.forEach((item) => {
      result[item.name] = item.count;
    });
    result.all = result.activated + result.deactivated;

    res.locals.stats = result;
    next();
  } catch (e) {
    next(e);
  }
};
