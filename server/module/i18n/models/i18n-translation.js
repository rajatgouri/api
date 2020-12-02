const Schema = require('mongoose').Schema;

const schema = new Schema({
  lang: { type: String, required: true, index: true },
  textId: { type: Schema.Types.ObjectId },
  text: { type: String },
  translation: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  restrict: true,
  minimize: false,
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

module.exports = schema;