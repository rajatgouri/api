/* eslint prefer-arrow-callback: 0 */
const Schema = require('mongoose').Schema;

const schema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  uuid: {
    type: String
  },
  price: {
    type: Number,
    default: 0
  },
  salePrice: {
    type: Number,
    default: null
  },
  // base on shop country
  // it is not editable but fill from profile automatically
  currency: {
    type: String
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  digitalFileId: {
    type: Schema.Types.ObjectId,
    ref: 'Media'
  },
  options: [{
    _id: false,
    optionKey: String,
    key: String,
    value: String,
    displayText: String
  }],
  specifications: [{
    _id: false,
    key: String, // eg color, weight
    value: String
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
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
  toJSON: { virtuals: true }
});

schema.pre('save', function beforeSave(next) {
  if (!this.uuid) {
    this.uuid = Helper.String.randomString(7);
  }

  next();
});

schema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

schema.virtual('digitalFile', {
  ref: 'Media',
  localField: 'digitalFileId',
  foreignField: '_id',
  justOne: true
});

// TODO - unset for id fields when respond JSON

module.exports = schema;
