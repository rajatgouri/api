const Schema = require('mongoose').Schema;

const schema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  totalProducts: {
    type: Number,
    default: 1
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  // site currency
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  userCurrency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  userTotalPrice: {
    type: Number,
    default: 0
  },
  currencyExchangeRate: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    index: true,
    default: 'pending'
  },
  codVerifyCode: {
    type: String,
    index: true
  },
  codVerified: {
    type: Boolean,
    default: true
  },
  phoneNumber: {
    type: String
  },
  email: {
    type: String,
    lowercase: true
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  fullName: {
    type: String
  },
  streetAddress: {
    type: String
  },
  city: {
    type: String
  },
  state: {
    type: String
  },
  country: {
    type: String
  },
  zipCode: {
    type: String
  },
  shippingAddress: {
    type: String
  },
  paymentMethod: {
    type: String,
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    default: 'pending',
    index: true
  },
  transactionId: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  trackingCode: {
    type: String,
    index: true
  },
  userAgent: {
    type: String
  },
  userIP: {
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

schema.virtual('details', {
  ref: 'OrderDetail',
  localField: '_id',
  foreignField: 'orderId',
  justOne: false // have many details here
});

schema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

module.exports = schema;
