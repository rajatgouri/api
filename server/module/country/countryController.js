exports.getCountries = async (req, res, next) => {
  try {
    res.locals.countries = await DB.Country.find();
    next();
  } catch (e) {
    next(e);
  }
};

exports.getStates = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.country) {
      if (Helper.App.isMongoId(req.query.country)) {
        query.countryId = req.query.country;
      } else {
        query.countryCode = req.query.country;
      }
    }
    res.locals.states = await DB.State.find(query);
    next();
  } catch (e) {
    next(e);
  }
};

exports.getCities = async (req, res, next) => {
  try {
    if (req.query.state) {
      res.locals.cities = await DB.City.find({
        $or: [{
          stateId: req.query.state
        }]
      });
    } else {
      res.locals.cities = [];
    }

    next();
  } catch (e) {
    next(e);
  }
};
