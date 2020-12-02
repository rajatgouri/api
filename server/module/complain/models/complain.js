const Schema = require('mongoose').Schema;

const schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId
  },
  content: {
    type: String
  },
  note: {
    type: String
  },
  code: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'rejected'],
    default: 'pending'
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

schema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

module.exports = schema;
