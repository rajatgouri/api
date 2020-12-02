const Schema = require('mongoose').Schema;

const schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  name: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    trim: true
  },
  transactionId: {
    type:String,
    trim: true
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  }
}, {
  restrict: true,
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

module.exports = schema;
