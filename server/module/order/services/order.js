/* eslint no-param-reassign: 0, no-await-in-loop: 0, no-restricted-syntax: 0, no-continue: 0 */
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const url = require('url');
const nconf = require('nconf');
const Queue = require('../../../kernel/services/queue');
const moment = require('moment');

const orderQ = Queue.create('order');
const COMMISSION_RATE = process.env.COMMISSION_FEE || 0.2;
const SITE_CURRENCY = process.env.SITE_CURRENCY || 'USD';

exports.getCommission = async () => {
  try {
    const config = await DB.Config.findOne({ key: 'siteCommission' });
    if (!config || config.value > 1 || config.value < 0) {
      return COMMISSION_RATE;
    }

    return config.value;
  } catch (e) {
    return process.env.COMMISSION_FEE || 0.2;
  }
};

exports.create = async (data, user) => {
  try {
    const siteCommission = await this.getCommission();
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
      .populate('shop')
      .populate('mainImage')
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
    const customerInfo = _.pick(data, [
      'phoneNumber', 'firstName', 'lastName', 'email',
      'city', 'state', 'country', 'zipCode',
      'streetAddress', 'shippingAddress', 'paymentMethod',
      'userIP', 'userAgent'
    ]);
    // TODO - check product stock quanntity, check shipping method or COD
    const orderDetails = [];
    const order = new DB.Order(Object.assign(customerInfo, {
      customerId: user._id,
      currency: SITE_CURRENCY,
      trackingCode: Helper.String.randomString(7).toUpperCase(),
      userCurrency,
      currencyExchangeRate
    }));
    let totalProducts = 0;
    let totalPrice = 0;
    // TODO - check shipping fee deeply with shop settings
    for (const product of mappingProducts) {
      let taxPrice = 0;
      let unitPrice = product.product.salePrice || product.product.price;
      let variant;
      const orderDetail = new DB.OrderDetail(Object.assign(customerInfo, {
        orderId: order._id,
        customerId: user._id || null,
        shopId: product.shop._id,
        productId: product.product._id,
        productVariantId: product.productVariantId,
        userNote: product.userNote,
        trackingCode: Helper.String.randomString(7).toUpperCase(),
        quantity: product.quantity,
        unitPrice,
        currency: SITE_CURRENCY,
        productDetails: product.product, // TODO - just pick go needed field
        userCurrency,
        currencyExchangeRate,
        startDate: product.startDate?moment(product.startDate).format('YYYY-MM-DD'):'',
        endDate: product.endDate?moment(product.endDate).format('YYYY-MM-DD'):''
      }));
      if (product.productVariantId) {
        variant = await DB.ProductVariant.findOne({ _id: product.productVariantId });
        if (variant) {
          unitPrice = variant.salePrice || variant.price || product.salePrice || product.price;
          if (variant.stockQuantity <= 0) {
            // TODO - check here and throw error?
            continue;
          }
        }

        orderDetail.variantDetails = variant;
      }

      // calculate and update coupon data
      let discountPercentage = 0;
      if (product.couponCode) {
        const coupon = await Service.Coupon.checkValid(product.shop.id, product.couponCode);
        if (coupon && coupon !== false) {
          orderDetail.discountPercentage = coupon.discountPercentage;
          orderDetail.couponCode = coupon.code;
          orderDetail.couponName = coupon.name;

          coupon.usedCount++;
          await coupon.save();
          discountPercentage = coupon.discountPercentage;
        }
      }

      if(product.product.transactiontype && (product.product.transactiontype.name == 'Rent' || product.product.transactiontype.name == 'Share')){
        unitPrice = Service.Product.calculateRentPrice(product.product, product.startDate, product.endDate);
        orderDetail.unitPrice = unitPrice;
        orderDetail.depositAmount = product.product.depositAmont;
      } else {
        orderDetail.depositAmount = 0;
      }

      
      if (product.product.taxPercentage && product.product.taxClass) {
        taxPrice = product.product.taxPercentage ? unitPrice * (product.product.taxPercentage / 100) : 0;
        orderDetail.taxPrice = taxPrice * product.quantity;
        orderDetail.taxClass = product.product.taxClass;
        orderDetail.taxPercentage = product.product.taxPercentage;
        orderDetail.userTaxPrice = taxPrice * currencyExchangeRate * product.quantity;
      }

      
      

      const priceBeforeDiscount = unitPrice * product.quantity;
      const productPrice = discountPercentage ? priceBeforeDiscount - (priceBeforeDiscount * (discountPercentage / 100)) : priceBeforeDiscount;
      totalProducts += product.quantity;

      // shipping calculator
      let shippingPrice = 0;
      let userShippingPrice = 0;
      // check freeship setting for the area
      let freeShip = false;
      if (!product.product.freeShip) {
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
      }
      if (!freeShip && !product.product.freeShip && product.shop.storeWideShipping) {
        shippingPrice = product.shop.shippingSettings.defaultPrice;
        if (product.quantity > 1) {
          shippingPrice += product.shop.shippingSettings.perQuantityPrice * (product.quantity - 1);
        }
        userShippingPrice = shippingPrice * currencyExchangeRate;
      }
      orderDetail.shippingPrice = shippingPrice;
      orderDetail.userShippingPrice = userShippingPrice;

      // TODO - check here for shipping price
      orderDetail.productPrice = productPrice;
      orderDetail.totalPrice = Math.round((productPrice + orderDetail.taxPrice + shippingPrice + orderDetail.depositAmount) * 100) / 100; // TODO - round me

      // fee base on order total price
      orderDetail.commissionRate = siteCommission;
      orderDetail.commission = orderDetail.totalPrice * siteCommission;
      orderDetail.balance = orderDetail.totalPrice - orderDetail.commission;

      totalPrice += orderDetail.totalPrice;
      orderDetail.userTotalPrice = orderDetail.totalPrice * currencyExchangeRate;
      orderDetails.push(orderDetail);
    }

    order.totalProducts = totalProducts;
    order.totalPrice = totalPrice;
    order.userTotalPrice = totalPrice * currencyExchangeRate;
    await order.save();
    await Promise.all(orderDetails.map(orderDetail => orderDetail.save()));

    // update quantity for order detail and
    await Service.Order.updateProductQuantity(orderDetails);
    if (order.paymentMethod === 'cod') {
      await this.sendEmailSummary(order._id);
    }
    return order;
  } catch (e) {
    throw e;
  }
};

exports.updateProductQuantity = async (orderDetail) => {
  try {
    const orderDetails = Array.isArray(orderDetail) ? orderDetail : [orderDetail];
    return Promise.all(orderDetails.map(({ productId, productVariantId, quantity }) => Service.Product.updateQuantity({ productId, productVariantId, quantity })));
  } catch (e) {
    throw e;
  }
};

exports.updatePaid = async (orderId, transactionId) => {
  try {
    await DB.Order.update({ _id: orderId }, {
      $set: {
        paymentStatus: 'paid',
        transactionId
      }
    });
    await DB.OrderDetail.updateMany({ orderId }, {
      $set: {
        paymentStatus: 'paid',
        transactionId
        // status: 'completed'
      }
    });

    const orderDetails = await DB.OrderDetail.find({ orderId });
    await Promise.all(orderDetails.map(orderDetail => Service.Order.sendDigitalLink(orderDetail)));

    // send email order success to user & shop
    await this.sendEmailSummary(orderId);

    await this.addLog({
      eventType: 'updatePaid',
      changedBy: orderDetails.customerId || null,
      orderId,
      oldData: {
        paymentStatus: 'pending'
      },
      newData: {
        paymentStatus: 'paid'
      }
    });

    return true;
  } catch (e) {
    throw e;
  }
};

exports.requestRefund = async (data) => {
  try {
    const details = await DB.OrderDetail.findOne({ _id: data.orderDetailId });
    if (!details) {
      throw new Error('Order detail not found');
    }

    if (details.status === 'refunded') {
      throw new Error('Order has been refunded');
    }

    // notify email to seller and admin
    const refundRequest = new DB.RefundRequest({
      orderDetailId: details._id,
      orderId: details.orderId,
      shopId: details.shopId,
      reason: data.reason,
      customerId: details.customerId
    });
    await refundRequest.save();

    // notify email
    const order = await DB.Order.findOne({ _id: details.orderId });
    const shop = await DB.Shop.findOne({ _id: details.shopId });
    if (order && shop) {
      const customer = await DB.User.findOne({ _id: details.customerId });
      if (shop.email) {
        Service.Mailer.send('order/refund-request-shop.html', shop.email, {
          subject: `Refund request for order #${details.trackingCode}`,
          customer: customer.toObject(),
          order,
          subOrder: details,
          refundRequest: refundRequest.toObject()
        });
      }

      Service.Mailer.send('order/refund-request-admin.html', process.env.EMAIL_NOTIFICATION_REFUND, {
        subject: `Refund request for sub order #${details.trackingCode} or order #${order.trackingCode}`,
        customer: customer.toObject(),
        order,
        subOrder: details,
        refundRequest: refundRequest.toObject(),
        shop: shop.toObject()
      });
    }

    return refundRequest;
  } catch (e) {
    throw e;
  }
};

exports.verifyPhoneCheck = async (data) => {
  try {
    const phoneCheck = await DB.PhoneCheck.findOne(data);
    if (!phoneCheck) {
      throw new Error('Phone verify code is invalid');
    }

    await phoneCheck.remove();
    return true;
  } catch (e) {
    throw e;
  }
};

exports.sendDigitalLink = async (orderDetailId) => {
  try {
    const orderDetail = orderDetailId instanceof DB.OrderDetail ? orderDetailId : await DB.OrderDetail.findOne({ _id: orderDetailId });
    if (!orderDetail) {
      throw new Error('Order detail not found');
    }

    // check product, if it is digital, we will send email to user with digital link.
    // update order status is paid?
    if (!orderDetail.productDetails || orderDetail.productDetails.type !== 'digital') {
      return false;
    }
    let digitalFileId;
    if (orderDetail.variantDetails && orderDetail.variantDetails.digitalFileId) {
      digitalFileId = orderDetail.variantDetails.digitalFileId;
    } else if (orderDetail.productDetails && orderDetail.productDetails.digitalFileId) {
      digitalFileId = orderDetail.productDetails.digitalFileId;
    }
    if (!digitalFileId) {
      return false;
    }

    // send link with jwt encrypt to user with download link
    const expireTokenDuration = 60 * 60 * 24 * 1; // 1 days
    const jwtToken = jwt.sign({
      orderDetailId: orderDetail._id,
      digitalFileId
    }, process.env.SESSION_SECRET, {
      expiresIn: expireTokenDuration
    });
    let customerEmail = orderDetail.email;
    if (orderDetail.customerId) {
      const customer = await DB.User.findOne({ _id: orderDetail.customerId });
      if (customer) {
        customerEmail = customer.email;
      }
    }

    const shop = await DB.Shop.findOne({ _id: orderDetail.shopId });
    await Service.Mailer.send('order/digital-download-link.html', customerEmail, {
      subject: `Download link for order #${orderDetail.trackingCode}`,
      downloadLink: url.resolve(nconf.get('baseUrl'), `v1/orders/details/${orderDetail._id}/digitals/download?token=${jwtToken}`),
      shop,
      orderDetail
    });
    if (['pending', 'progressing', 'shipping'].indexOf(orderDetail.status)) {
      orderDetail.status = 'completed';
      await orderDetail.save();
    }
    return true;
  } catch (e) {
    throw e;
  }
};

exports.getDigitalFileFromToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const file = await DB.Media.findOne({ _id: decoded.digitalFileId });
    if (!file) {
      throw new Error('No file found!');
    }

    // if support s3 and this is s3 link, we will create signed url for this link
    if (process.env.USE_S3 === 'true' && Helper.String.isUrl(file.filePath)) {
      return Service.S3.getSignedUrl(file.filePath, {
        expiresInMinutes: 4 * 60
      });
    }

    return file.filePath;
  } catch (e) {
    throw e;
  }
};

exports.getCsvData = async (query = {}, sort = { createdAt: -1 }) => {
  try {
    query.$or = [{
      paymentStatus: 'paid',
      paymentMethod: { $ne: 'cod' }
    }, {
      paymentMethod: 'cod'
    }];

    const items = await DB.OrderDetail.find(query)
      .populate('customer')
      .sort(sort)
      .exec();
    const resutls = items.map((item) => {
      const data = item.toJSON();
      if (item.customer) {
        data.customer = item.customer.toJSON();
      }
      data.details = item.details || [];
      return data;
    });
    return resutls;
  } catch (e) {
    throw e;
  }
};

exports.updateStatus = async (subOrder, status) => {
  try {
    subOrder.status = status;
    await DB.OrderDetail.update({ _id: subOrder._id }, {
      $set: { status }
    });

    let customerEmail = subOrder.email;
    if (!customerEmail && subOrder.customer) {
      customerEmail = subOrder.customer.email;
    }

    if (customerEmail) {
      const order = await DB.Order.findOne({ _id: subOrder.orderId });
      if (order) {
        await Service.Mailer.send('order/sub-order-status-change.html', customerEmail, {
          subject: `Order sub #${subOrder.trackingCode} of #${order.trackingCode} status has changed`,
          user: order.customer ? order.customer : {
            name: subOrder.fullName || `${subOrder.firstName} ${subOrder.lastName}`
          },
          order,
          subOrder,
          orderLink: url.resolve(process.env.userWebUrl, `orders/view/${order._id}`)
        });
      }
    }

    return subOrder;
  } catch (e) {
    throw e;
  }
};

orderQ.process(async (job, done) => {
  try {
    const data = job.data;
    if (data.action !== 'sendMailSummary') {
      // not support yet
      return done();
    }
    const orderId = data.orderId;
    const order = await DB.Order.findOne({ _id: orderId });
    if (!order) {
      return done();
    }
    const orderDetails = await DB.OrderDetail.find({ orderId }).populate('shop');
    let customer;
    if (order.customerId) {
      customer = await DB.User.findOne({ _id: order.customerId });
    }
    if (!customer) {
      customer = {
        name: order.fullName || `${order.firstName} ${order.lastName}`,
        email: order.email
      };
    }

    await Service.Mailer.send('order/order-summary-customer.html', order.email || customer.email, {
      subject: `New order #${order.trackingCode}`,
      order: order.toObject(),
      bookTime: new Date(order.createdAt).toLocaleString('en-US'),
      orderDetails: orderDetails.map((o) => {
        const oData = o.toObject();
        oData.shop = o.shop;
        return oData;
      }),
      customer,
      orderLink: order.customerId ? url.resolve(process.env.userWebUrl, `orders/view/${order._id}`) : ''
    });
    await Promise.all(orderDetails
      .filter(o => o.shop)
      .map(orderDetail => Service.Mailer.send('order/order-summary-shop.html', orderDetail.shop.email, {
        subject: `New order #${orderDetail.trackingCode}`,
        orderDetail: orderDetail.toObject(),
        customer,
        orderLink: url.resolve(process.env.sellerWebUrl, `orders/view/${orderDetail._id}`)
      })));

    return done();
  } catch (e) {
    await Service.Logger.create({
      level: 'error',
      path: 'send-order-email-summary-queue',
      error: e
    });
    return done();
  }
});

exports.sendEmailSummary = async (orderId) => {
  try {
    return orderQ.createJob({
      action: 'sendMailSummary',
      orderId
    }).save();
  } catch (e) {
    throw e;
  }
};

exports.getPdfInvoiceStream = async (orderDetailId, forShop) => {
  try {
    const order = orderDetailId instanceof DB.OrderDetail ? orderDetailId : await DB.OrderDetail.findOne({ _id: orderDetailId });
    if (!order) {
      throw new Error('Order not found');
    }

    const template = forShop ? 'order/invoice-shop.html' : 'order/invoice-customer.html';
    return Service.Pdf.toStreamFromTemplate(template, {
      orderDetail: order.toObject()
    });
  } catch (e) {
    throw e;
  }
};

exports.addLog = async (options) => {
  try {
    // TODO - check me
    return DB.OrderLog.create(options);
  } catch (e) {
    throw e;
  }
};
