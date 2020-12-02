
const request = require('request');

exports.getLocationFromAddress = async (address) => {
  try {
    const uri = `https://maps.google.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_GEOCODE_API_KEY}`;
    return new Promise((resolve, reject) => request(
      {
        method: 'GET',
        uri
      },
      async (err, response, body) => {
        if (err) {
          return reject(err);
        }

        try {
          const data = JSON.parse(body);
          if (data.status !== 'OK' || !data.results.length) {
            return resolve({
              longitude: 0,
              latitude: 0
            });
          }

          return resolve({
            longitude: data.results[0].geometry.location.lng,
            latitude: data.results[0].geometry.location.lat
          });
        } catch (e) {
          return resolve({
            longitude: 0,
            latitude: 0
          });
        }
      }
    ));
  } catch (e) {
    throw e;
  }
};
