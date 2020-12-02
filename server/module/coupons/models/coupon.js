const Schema = require('mongoose').Schema;

const schema = new Schema({
  name: {
    type: String
  },
  code: {
    type: String,
    index: true,
    uppercase: true,
    trim: true
  },
  shopId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  discountPercentage: {
    type: Number,
    default: 10
  },
  used: {
    type: Boolean,
    default: false
  },
  limit: {
    type: Number,
    default: 0
  },
  usedCount: {
    type: Number,
    default: 0
  },
  expired: {
    type: Boolean,
    default: false
  },
  expiredTime: {
    type: Date
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
