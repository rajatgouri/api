const Schema = require('mongoose').Schema;

const schema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'Shop',
    index: true
  },
  rateBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  comment: {
    type: String
  },
  rating: {
    type: Number
  },
  type: {
    type: String,
    default: 'product',
    index: true
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

schema.virtual('rater', {
  ref: 'User',
  localField: 'rateBy',
  foreignField: '_id',
  justOne: true
});

module.exports = schema;
