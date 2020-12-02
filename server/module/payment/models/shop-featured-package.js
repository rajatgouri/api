const Schema = require('mongoose').Schema;

const schema = new Schema({
  name: {
    type: String
  },
  description: {
    type: String
  },
  price: {
    type: Number
  },
  numDays: {
    type: Number,
    default: 30
  },
  ordering: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  }
}, {
  restrict: true,
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
  toJSON: {
    virtuals: true
  }
});

module.exports = schema;
