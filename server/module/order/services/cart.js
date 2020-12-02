/* eslint no-param-reassign: 0, no-await-in-loop: 0, no-restricted-syntax: 0, no-continue: 0 */
const _ = require('lodash');
const moment = require('moment');

const SITE_CURRENCY = process.env.SITE_CURRENCY || 'USD';

/**
 * calculate cart information and return about price, shipping price, etc...
 * @param {*} data
 */
exports.calculate = async (data) => {
  try {
    // get currency if have
    const currency = SITE_CURRENCY;
    const userCurrency = data.userCurrency || SITE_CURRENCY;
    let currencyExchangeRate = 1;
    if (data.userCurrency) {
      try {
        currencyExchangeRate = await Service.Currency.getRate(currency, userCurrency);
      } catch (e) {
        currencyExchangeRate = 1;
      }
    }

    const productIds = data.products.map(p => p.productId);
    const products = await DB.Product.find({ _id: { $in: productIds } })
      .populate('mainImage')
      .populate('shop')
      .populate('transactiontype');
    if (!products.length) {
      throw new Error('No products');
    }
    const mappingProducts = data.products;
    mappingProducts.filter((product) => {
      const p = products.find(i => i._id.toString() === product.productId);
      if (p) {
        product.product = p;
        product.shop = p.shop;
        return true;
      }

      return false;
    });

    // TODO - check product stock quanntity, check shipping method or COD
    const orderDetails = [];
    const order = {
      currency: SITE_CURRENCY,
      userCurrency,
      currencyExchangeRate
    };
    let totalProducts = 0;
    let totalPrice = 0;
    // TODO - check shipping fee deeply with shop settings
    for (const product of mappingProducts) {
      let taxPrice = 0;
      // let shippingPrice = 0;
      let unitPrice = product.product.salePrice || product.product.price;
      let stockQuantity = product.product.stockQuantity;
      let variant;

      const orderDetail = {
        shopId: product.shop._id,
        productId: product.product._id,
        productVariantId: product.productVariantId,
        quantity: product.quantity || 1,
        unitPrice,
        currency: SITE_CURRENCY,
        userCurrency,
        currencyExchangeRate,
        error: false,
        taxClass: product.product.taxClass,
        taxPercentage: product.product.taxPercentage,
        freeShip: product.product.freeShip,
        storeWideShipping: product.shop.storeWideShipping,
        shippingSettings: _.pick(product.shop.shippingSettings, [
          'defaultPrice', 'perQuantityPrice'
        ]),
        product: product.product,
        restrictFreeShipAreas: product.product.restrictFreeShipAreas,
        startDate: product.startDate?moment(product.startDate).format('MM/DD/YYYY'):'',
        endDate: product.endDate?moment(product.endDate).format('MM/DD/YYYY'):''
      };

      // recheck freeship setting
      if (!orderDetail.freeShip) {
        let freeShip = false;
        _.each(product.product.restrictFreeShipAreas, (area) => {
          if (area.areaType === 'zipcode' && data.zipCode && area.value === data.zipCode) {
            freeShip = true;
          } else if (area.areaType === 'city' && data.city && area.value === data.city) {
            freeShip = true;
          } else if (area.areaType === 'state' && data.state && area.value === data.state) {
            freeShip = true;
          } else if (area.areaType === 'country' && data.country && area.country === data.country) {
            freeShip = true;
          }
        });
        orderDetail.freeShip = freeShip;
      }

      if (product.productVariantId) {
        variant = await DB.ProductVariant.findOne({ _id: product.productVariantId });
        if (variant) {
          unitPrice = variant.salePrice || variant.price || product.salePrice || product.price;
          stockQuantity = variant.stockQuantity;
          if (variant.stockQuantity <= 0) {
            // TODO - check here and throw error?
            orderDetail.error = true;
            orderDetail.errorMessage = 'Product is out of stock';
            continue;
          }
        }

        orderDetail.variant = variant;
      } else if (product.stockQuantity <= 0) {
        // TODO - check here and throw error?
        orderDetail.error = true;
        orderDetail.errorMessage = 'Product is out of stock';
        continue;
      }
      // calculate and update coupon data
      let discountPercentage = 0;
      if (product.couponCode) {
        const coupon = await Service.Coupon.checkValid(product.shop.id, product.couponCode);
        if (coupon && coupon !== false) {
          orderDetail.discountPercentage = coupon.discountPercentage;
          orderDetail.couponCode = coupon.code;
          orderDetail.couponName = coupon.name;
          discountPercentage = coupon.discountPercentage;
        }
      }

      if(product.product.transactiontype && (product.product.transactiontype.name == 'Rent' || product.product.transactiontype.name == 'Share')){
        unitPrice = Service.Product.calculateRentPrice(product.product, product.startDate, product.endDate);
      }

      
      const priceBeforeDiscount = unitPrice * product.quantity;
      const productPrice = Helper.Number.round(discountPercentage ? priceBeforeDiscount * (discountPercentage / 100) : priceBeforeDiscount);
      totalProducts += product.quantity;

      
      
      orderDetail.unitPrice = productPrice;

      if (product.taxPercentage && product.taxClass) {
        taxPrice = Math.round(productPrice * (product.taxPercentage / 100), 2);
        orderDetail.taxPrice = taxPrice;
        orderDetail.taxClass = product.taxClass;
        orderDetail.taxPercentage = product.taxPercentage;
        orderDetail.userTaxPrice = Helper.Number.round(taxPrice * currencyExchangeRate);
      }

      // TODO - check here for shipping price
      orderDetail.productPrice = productPrice;
      totalPrice += orderDetail.totalPrice;
      orderDetail.userProductPrice = Helper.Number.round(productPrice * currencyExchangeRate);
      orderDetail.stockQuantity = stockQuantity;
      

      orderDetails.push(orderDetail);
    }

    order.totalProducts = totalProducts;
    order.totalPrice = totalPrice;
    order.userTotalPrice = Helper.Number.round(totalPrice * currencyExchangeRate);

    order.products = orderDetails;
    return order;
  } catch (e) {
    throw e;
  }
};
