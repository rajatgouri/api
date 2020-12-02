const Schema = require('mongoose').Schema;

const schema = new Schema({
  name: {
    type: String
  },
  alias: {
    type: String,
    index: true
  },
  description: {
    type: String
  },
  totalProduct: {
    type: Number,
    default: 0
  },
  meta: {
    type: Schema.Types.Mixed
  },
  ordering: {
    type: Number,
    default: 0
  },
  logo: {
    type: Schema.Types.ObjectId,
    ref: 'Media'
  },
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
