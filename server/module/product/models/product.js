/* eslint prefer-arrow-callback: 0, no-param-reassign: 0 */
const Schema = require('mongoose').Schema;

const schema = new Schema({
  name: {
    type: String
  },
  alias: {
    type: String,
    index: true
  },
  shortDescription: {
    type: String
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['physical', 'digital'],
    default: 'physical'
  },
  price: {
    type: Number,
    default: 0
  },
  pricePerWeek: {
    type: Number,
    default: 0
  },
  pricePerMonth: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: 0
  },
  endDate: {
    type: Date,
    default: 0
  },
  salePrice: {
    type: Number,
    default: null
  },
  depositAmont: {
    type: Number,
    default: null
  },
  distance: {
    type: Number,
    default: null
  },
  discounted: {
    type: Boolean,
    default: false
  },
  // base on shop country
  // it is not editable but fill from profile automatically
  currency: {
    type: String,
    uppercase: true
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'ProductCategory'
  },
  transactiontypeId: {
    type: Schema.Types.ObjectId,
    ref: 'ProductTransactionType'
  },
  producttypeId: {
    type: Schema.Types.ObjectId,
    ref: 'ProductType'
  },
  brandId: {
    type: Schema.Types.ObjectId,
    ref: 'Brand'
  },
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'Shop'
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  // base on  the category
  specifications: [{
    _id: false,
    key: String, // eg color, weight
    value: String
  }],
  featured: {
    type: Boolean,
    default: false
  },
  hot: {
    type: Boolean,
    default: false
  },
  bestSell: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // stock keeping unit
  sku: {
    type: String,
    default: ''
  },
  // univeral product code
  upc: {
    type: String,
    default: ''
  },
  // manufater part number
  mpn: {
    type: String,
    default: ''
  },
  // european article number
  ean: {
    type: String,
    default: ''
  },
  // japanese artical number
  jan: {
    type: String,
    default: ''
  },
  // international standard book number
  isbn: {
    type: String,
    default: ''
  },
  
  metaSeo: {
    keywords: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    }
  },
  notification: {
    type: Boolean,
    trim: true
  },
  images: [{
    type: Schema.Types.ObjectId,
    ref: 'Media'
  }],
  mainImage: {
    type: Schema.Types.ObjectId,
    ref: 'Media'
  },
  shopVerified: {
    type: Boolean,
    default: false
  },
  shopActivated: {
    type: Boolean,
    default: false
  },
  shopFeatured: {
    type: Boolean,
    default: false
  },
  taxClass: {
    type: String
  },
  taxPercentage: {
    type: Number,
    default: 0
  },
  digitalFileId: {
    type: Schema.Types.ObjectId,
    ref: 'Media'
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      trim: true
    },
    coordinates: {
      type: Array
    },
    country: {
      type: String,
      trim: true
    }, 
    countryCode: {
      type: String,
      trim: true
    },
    zipcode: {
      type: String,
      trim: true
    }

  },
  restrictCODAreas: [{
    type: String,
    default: []
  }],
  freeShip: {
    type: Boolean,
    default: true
  },
  publish: {
    type: Boolean,
    trim: true
  },
  reasonForNotPublish: {
    type: String,
    trim:true
  },
  restrictFreeShipAreas: [{
    _id: false,
    areaType: {
      type: String,
      enum: ['zipcode', 'city', 'state', 'country']
    },
    value: String,
    name: String
  }],
  dailyDeal: {
    type: Boolean,
    default: false
  },
  dealTo: {
    type: Date
  },
  soldOut: {
    type: Boolean,
    default: false
  },
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});



schema.virtual('category', {
  ref: 'ProductCategory', // The model to use
  localField: 'categoryId', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
  // If `justOne` is true, 'members' will be a single doc as opposed to
  // an array. `justOne` is false by default.
  justOne: true
});

schema.virtual('transactiontype', {
  ref: 'ProductTransactionType', // The model to use
  localField: 'transactiontypeId', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
  // If `justOne` is true, 'members' will be a single doc as opposed to
  // an array. `justOne` is false by default.
  justOne: true
});

schema.virtual('producttype', {
  ref: 'ProductType', // The model to use
  localField: 'producttypeId', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
  // If `justOne` is true, 'members' will be a single doc as opposed to
  // an array. `justOne` is false by default.
  justOne: true
});

schema.virtual('brand', {
  ref: 'Brand', // The model to use
  localField: 'brandId', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
  // If `justOne` is true, 'members' will be a single doc as opposed to
  // an array. `justOne` is false by default.
  justOne: true
});

schema.virtual('shop', {
  ref: 'Shop',
  localField: 'shopId',
  foreignField: '_id',
  justOne: true
});

schema.virtual('digitalFile', {
  ref: 'Media',
  localField: 'digitalFileId',
  foreignField: '_id',
  justOne: true
});

schema.pre('save', async function beforeSave(next) {
  if (this.images.length && !this.mainImage) {
    this.mainImage = this.images[0];
  }

  // remove tags
  this.description = Helper.String.removeScriptTag(this.description);
  ['name', 'shortDescription', 'sku', 'upc', 'mpn', 'ean', 'jan', 'jsbn', 'taxClass'].forEach((key) => {
    this[key] = Helper.String.stripTags(this[key]);
  });
  let alias = this.alias || Helper.String.createAlias(this.name);
  const count = await DB.Product.count({ alias, _id: { $ne: this._id } });
  if (count) {
    alias = `${alias}-${Helper.String.randomString(5).toLowerCase()}`;
  }
  this.alias = alias.trim();

  if (this.specifications && this.specifications.length) {
    this.specifications.forEach((spec) => {
      spec.value = Helper.String.stripTags(spec.value);
    });
  }
  this.metaSeo.keywords = Helper.String.stripTags(this.metaSeo.keywords);
  this.metaSeo.description = Helper.String.stripTags(this.metaSeo.description);

  next();
});

// TODO - unset for id fields when respond JSON

module.exports = schema;
