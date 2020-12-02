const Schema = require('mongoose').Schema;

const schema = new Schema({
    name: {
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
    }
});

// TODO - unset for id fields when respond JSON

module.exports = schema;