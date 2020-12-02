/* eslint-disable */

const _ = require('lodash');
const countries = require('./data/countries.json').countries;
const states = require('./data/states.json').states;
const cities = require('./data/cities.json').cities;

module.exports = async () => {
  await DB.Country.remove();
  await DB.State.remove();
  await DB.City.remove();

  for (const c of countries) {
    const country = new DB.Country({
      name: c.name,
      isoCode: c.sortname
    });

    await country.save();

    const countryStates = _.filter(states, state => state.country_id === c.id);
    for (const s of countryStates) {
      const state = new DB.State({
        name: s.name,
        countryCode: c.sortname,
        countryId: country._id
      });

      await state.save();

      const stateCities = _.filter(cities, city => city.state_id === s.id);
      for (const ct of stateCities) {
        const city = new DB.City({
          name: ct.name,
          countryCode: country.isoCode,
          state: state.name,
          stateId: state._id
        });

        city.save();
      }
    }
  }
};

/* eslint-enable */
