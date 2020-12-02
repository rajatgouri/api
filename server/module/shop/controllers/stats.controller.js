exports.stats = async (req, res, next) => {
  try {
    const queries = [{
      name: 'verified',
      query: { verified: true }
    }, {
      name: 'unverified',
      query: { verified: false }
    }, {
      name: 'activated',
      query: { activated: true }
    }, {
      name: 'deactivated',
      query: { activated: false }
    }, {
      name: 'featured',
      query: { featured: true }
    }];
    const promises = queries.map(query => DB.Shop.count(query.query)
      .then(count => ({ count, name: query.name })));
    const data = await Promise.all(promises);
    const result = {};
    data.forEach((item) => {
      result[item.name] = item.count;
    });
    result.all = result.verified + result.unverified;

    res.locals.stats = result;
    next();
  } catch (e) {
    next(e);
  }
};
