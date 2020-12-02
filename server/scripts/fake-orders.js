/* eslint-disable */
const _ = require('lodash');

module.exports = async () => {
  try {
    const customers = await DB.User.find({ isShop: { $ne: true } });
    const products = await DB.Product.find()
      .populate('shop')
      .populate('mainImage');
    if (!products.length) {
      return;
    }

    for (const customer of customers) {
      const chunks = _.chunk(products, 2);
      for (const chunkProducts of chunks) {
        const order = new DB.Order({
          customerId: customer._id,
          currency: 'usd',
          totalProducts: 1,
          totalPrice: 1,
          phoneNumber: '+0987654321',
          firstName: 'First',
          lastName: 'Last',
          city: 'City',
          state: 'State',
          country: 'US',
          streetAddress: '123 somewhere',
          shippingAddress: '1234 somewhere',
          email: 'fake@email.com',
          trackingCode: Helper.String.randomString(7).toUpperCase(),
          userCurrency: 'USD',
          userTotalPrice: 100,
          currencyExchangeRate: 1
        });

        for (const product of chunkProducts) {
          const variants = await DB.ProductVariant.find({ productId: product._id });
          let variant = null;
          if (variants.length) {
            variant = variants[Math.floor(Math.random() * variants.length)];
          }
          const productDetails = product.toObject();
          productDetails.shop = _.pick(product.shop, [
            '_id', 'ownerId', 'name', 'alias', 'email', 'phoneNumber', 'address', 'returnAddress'
          ]);
          productDetails.mainImage = product.mainImage ? product.mainImage.getPublic() : null;
          const orderDetail = new DB.OrderDetail({
            orderId: order._id,
            customerId: customer._id,
            shopId: product.shop._id,
            productId: product._id,
            productVariantId: variant ? variant._id: null,
            userNote: 'This is fake data',
            quantity: 1,
            unitPrice: 100,
            currency: 'usd',
            productDetails,
            variantDetails: variant,
            trackingCode: Helper.String.randomString(5).toUpperCase(),
            phoneNumber: '+0987654321',
            firstName: 'First',
            lastName: 'Last',
            city: 'City',
            state: 'State',
            country: 'US',
            streetAddress: '123 somewhere',
            shippingAddress: '1234 somewhere',
            email: 'fake@email.com',
            userCurrency: 'USD',
            userTotalPrice: 100,
            currencyExchangeRate: 1
          });

          await orderDetail.save();
        }
        await order.save();
      }
    }
  } catch (e) {
    console.log(e);
  }
};

/* eslint-enable */
