const Schema = require('mongoose').Schema;

const schema = new Schema({
  name: {
    type: String
  },
  description: {
    type: String
  },
  key: {
    type: String,
    index: true
  },
  options: [{
    _id: false,
    key: String, // key for search
    displayText: String // display text
  }],
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  }
}, {
  minimize: false,
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

module.exports = schema;
