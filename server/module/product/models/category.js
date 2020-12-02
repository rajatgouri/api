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
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'ProductCategory'
  },
  mainImage: {
    type: Schema.Types.ObjectId,
    ref: 'Media'
  },
  totalProduct: {
    type: Number,
    default: 0
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
  ordering: {
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
  },
  toJSON: { virtuals: true }
});

module.exports = schema;
