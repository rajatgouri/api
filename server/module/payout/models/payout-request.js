/* eslint prefer-arrow-callback: 0 */
const moment = require('moment');
const Schema = require('mongoose').Schema;

const schema = new Schema({
  shopId: {
    type: Schema.Types.ObjectId
  },
  requestToTime: {
    type: Date
  },
  // total with commission
  total: {
    type: Number,
    default: 0
  },
  commission: {
    type: Number,
    default: 0
  },
  // balance user should get
  shopBalance: {
    type: Number,
    default: 0
  },
  // commission for cod and other points that user must pay again to website
  siteBalance: {
    type: Number,
    default: 0
  },
  paidToShop: {
    type: Boolean,
    default: false
  },
  // in next order, we will reduce amount in the user balance
  paidToSite: {
    type: Boolean,
    default: false
  },
  codBalance: {
    type: Number,
    default: 0
  },
  nonCodBalance: {
    type: Number,
    default: 0
  },
  payoutStatus: {
    type: String,
    default: 'pending',
    index: true
  },
  paidPayoutAmount: {
    type: Number,
    default: 0
  },
  payoutTransactionID: {
    type: String,
    default: 0
  },
  payoutAccountID: {
    type: String,
    default: 0
  },
  payoutPaymentID: {
    type: String,
    default: 0
  },
  payoutTransferDetails: {
    type: Schema.Types.Mixed
  },
  // prevent user sends too much request but it is not completed
  // we will do not allow to send too much time
  requestAttempts: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    default: 'pending',
    index: true
  },
  code: {
    type: String,
    index: true,
    uppercase: true
  },
  payoutAccount: {
    type: Schema.Types.Mixed
  },
  details: {
    type: Schema.Types.Mixed
  },
  rejectReason: {
    type: String
  },
  note: {
    type: String
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
  },
  toObject: {
    virtuals: true
  }
});

schema.index({ code: 1 }, { unique: true, sparse: true });

schema.pre('save', function beforeSave(next) {
  if (!this.code) {
    this.code = `PR${moment().format('YYYYMMDDHHmmssSS')}`;
  }
  next();
});

schema.virtual('shop', {
  ref: 'Shop',
  localField: 'shopId',
  foreignField: '_id',
  justOne: true
});

module.exports = schema;
