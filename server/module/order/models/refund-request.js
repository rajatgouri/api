const Schema = require('mongoose').Schema;

const schema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    index: true,
    ref: 'User'
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  orderDetailId: {
    type: Schema.Types.ObjectId,
    ref: 'OrderDetail'
  },
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'Shop'
  },
  reason: {
    type: String
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

schema.virtual('orderDetail', {
  ref: 'OrderDetail',
  localField: 'orderDetailId',
  foreignField: '_id',
  justOne: true
});

schema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

schema.virtual('shop', {
  ref: 'Shop',
  localField: 'shopId',
  foreignField: '_id',
  justOne: true
});

schema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

module.exports = schema;
