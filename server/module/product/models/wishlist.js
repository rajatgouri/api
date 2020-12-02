const Schema = require('mongoose').Schema;

const schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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
  },
  toJSON: {
    virtuals: true
  }
});

schema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

schema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

module.exports = schema;
