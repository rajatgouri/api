const countryController = require('./countryController');

exports.model = {
  City: require('./models/city'),
  State: require('./models/state'),
  Country: require('./models/country')
};

exports.router = (router) => {
  /**
   * @apiGroup Country
   * @apiVersion 1.0.0
   * @api {get} /v1/countries Get list all countries
   * @apiDescription Get list all countries
   * @apiPermission all
   */
  router.get(
    '/v1/countries',
    countryController.getCountries,
    Middleware.Response.success('countries')
  );

  /**
   * @apiGroup Country
   * @apiVersion 1.0.0
   * @api {get} /v1/states?:country Get list all states by country
   * @apiParam {String}   [country] country iso code or country id
   * @apiDescription Get list all states
   * @apiPermission all
   */
  router.get(
    '/v1/states',
    countryController.getStates,
    Middleware.Response.success('states')
  );

  /**
   * @apiGroup Country
   * @apiVersion 1.0.0
   * @api {get} /v1/cities?:state Get all cities by state
   * @apiParam {String}   [state] state id
   * @apiDescription Get list all cities by state. return empty if state is not provided
   * @apiPermission all
   */
  router.get(
    '/v1/cities',
    countryController.getCities,
    Middleware.Response.success('cities')
  );
};
