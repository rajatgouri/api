/* eslint prefer-arrow-callback: 0 */
exports.Product = (schema) => {
  schema.add({
    ratingAvg: {
      type: Number,
      default: 0
    },
    totalRating: {
      type: Number,
      default: 0
    },
    ratingScore: {
      type: Number,
      default: 0
    }
  });
};

exports.Shop = (schema) => {
  schema.add({
    ratingAvg: {
      type: Number,
      default: 0
    },
    totalRating: {
      type: Number,
      default: 0
    },
    ratingScore: {
      type: Number,
      default: 0
    }
  });
};
