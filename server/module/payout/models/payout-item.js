const Schema = require('mongoose').Schema;

const schema = new Schema({
  requestId: {
    type: Schema.Types.ObjectId
  },
  itemType: {
    type: String,
    index: true,
    default: 'order'
  },
  itemId: {
    type: Schema.Types.ObjectId
  },
  shopId: {
    type: Schema.Types.ObjectId
  },
  status: {
    type: String,
    index: true,
    default: 'pending'
  },
  total: {
    type: Number,
    default: 0
  },
  commission: {
    type: Number,
    default: 0
  },
  balance: {
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
  minimize: false,
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

module.exports = schema;
