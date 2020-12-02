const Schema = require('mongoose').Schema;

exports.User = (schema) => {
  schema.add({
    isShop: {
      type: Boolean,
      default: false
    },
    shopId: {
      type: Schema.Types.ObjectId
    }
  });
};
