const Schema = require('mongoose').Schema;

const schema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId
  },
  orderDetailId: {
    type: Schema.Types.ObjectId
  },
  changedBy: {
    type: Schema.Types.ObjectId
  },
  eventType: {
    type: String,
    index: true
  },
  oldData: {
    type: Schema.Types.Mixed
  },
  newData: {
    type: Schema.Types.Mixed
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
  }
});

module.exports = schema;
