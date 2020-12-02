const Schema = require('mongoose').Schema;

const schema = new Schema({
  name: {
    type: String
  },
  // alpha 2
  countryCode: {
    type: String,
    index: true
  },
  state: {
    type: String
  },
  stateId: {
    type: Schema.Types.ObjectId,
    ref: 'State'
  }
});

module.exports = schema;
