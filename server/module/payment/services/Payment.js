/* eslint no-param-reassign: 0 */
// handle all payment data from other paymentGateway
const Paypal = require('../components/Paypal');
const Stripe = require('../components/Stripe');
const Braintree = require('../components/Braintree');
const moment = require('moment');

async function extendShopFeaturedSubscription(shopId) {
  try {
    const shop = await DB.Shop.findOne({ _id: shopId });
    if (!shop) {
      throw new Error('shop not found');
    }

    shop.featured = true;
    shop.featuredTo = moment().add(1, 'month').toDate();
    return shop.save();
  } catch (e) {
    throw e;
  }
}

async function extendUserSubscribeSubscription(userId) {
  try {
    const user = await DB.User.findOne({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // TODO - should use update function?
    user.subscribed = true;
    user.subscribeTo = moment().add(1, 'month').toDate();
    return user.save();
  } catch (e) {
    throw e;
  }
}

exports.createSubscriptionTransaction = async (options) => {
  try {
    if (options.gateway !== 'paypal') {
      throw new Error('Not support gateway now!');
    }

    const paymentOptions = options;
    const key = options.subscriptionType;
    paymentOptions.config = {
      mode: process.env.PAYPAL_MODE,
      client_id: process.env.PAYPAL_CLIENT_ID,
      client_secret: process.env.PAYPAL_CLIENT_SECRET
    };
    let config = await DB.Config.findOne({ key });
    if (!config) {
      const billingPlan = await Paypal.createSubscriptionPlan(key, paymentOptions);
      config = new DB.Config({
        key,
        value: billingPlan,
        name: options.description,
        visible: false
      });
      await config.save();
    }

    const data = await Paypal.createSubscriptionPayment(config.value, paymentOptions);

    const transaction = new DB.Transaction({
      userId: options.userId,
      type: options.subscriptionType,
      price: options.price,
      description: options.description,
      products: [{
        id: options.subscriptionType,
        price: options.price,
        description: options.description
      }],
      paymentGateway: 'paypal',
      paymentId: data.id,
      paymentToken: data.token,
      meta: Object.assign(options.meta, data)
    });

    await transaction.save();
    return {
      redirectUrl: data.links.approval_url
    };
  } catch (e) {
    throw e;
  }
};

exports.executePaypalSubscriptionAgreement = async (paymentToken) => {
  try {
    const transaction = await DB.Transaction.findOne({ paymentToken });
    if (!transaction) {
      throw new Error('Cannot find this transaction');
    }

    const paymentOptions = {
      config: {
        mode: process.env.PAYPAL_MODE,
        client_id: process.env.PAYPAL_CLIENT_ID,
        client_secret: process.env.PAYPAL_CLIENT_SECRET
      },
    };
    const response = await Paypal.billingAgreementSubscription(paymentOptions, paymentToken);

    transaction.status = 'completed';
    transaction.paymentResponse = response;
    transaction.paymentAgreementId = response.id;
    // Log.deep(data);
    return await transaction.save();
  } catch (e) {
    throw e;
  }
};

exports.updatePaypalTransaction = async (body) => {
  try {
    // NOT support for single sale for now, just manage for subscription
    if (!body.resource.billing_agreement_id || body.event_type !== 'PAYMENT.SALE.COMPLETED') {
      return true;
    }
    const transaction = await DB.Transaction.findOne({ paymentAgreementId: body.resource.billing_agreement_id });
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    await DB.Transaction.update({ _id: transaction._id }, {
      $push: {
        histories: body
      }
    });

    // create new invoice for user
    const invoiceData = transaction.toObject();
    delete invoiceData._id;
    const invoice = new DB.Invoice(invoiceData);
    invoice.transactionId = transaction._id;
    await invoice.save();

    if (transaction.type === 'shop_subscription') {
      await extendShopFeaturedSubscription(invoice.userId);
    } else if (transaction.type === 'user_subscription') {
      await extendUserSubscribeSubscription(invoice.userId);
    }

    return true;
  } catch (e) {
    throw e;
  }
};



exports.createPaypalSinglePayment = async (options) => {
  try {
    const paymentOptions = options;
    paymentOptions.config = {
      mode: process.env.PAYPAL_MODE,
      client_id: process.env.PAYPAL_CLIENT_ID,
      client_secret: process.env.PAYPAL_CLIENT_SECRET
    };
    const data = await Paypal.createSinglePayment(paymentOptions);

    const transaction = new DB.Transaction({
      userId: options.userId,
      type: options.type,
      price: options.price,
      description: options.description,
      products: options.products || [{
        id: options.itemId,
        price: options.price,
        description: options.description
      }],
      paymentGateway: options.gateway,
      paymentId: data.id,
      paymentToken: data.token,
      meta: Object.assign(options.meta, data),
      itemId: options.itemId
    });

    await transaction.save();
    return { redirectUrl: data.links.approval_url };
  } catch (e) {
    throw e;
  }
};

exports.createStripeSinglePayment = async (options) => {
  try {
    const data = await Stripe.charge({
      amount: Math.round(options.price * 100),
      // for stripe must use lowercase
      currency: process.env.SITE_CURRENCY.toLowerCase(),
      source: options.stripeToken,
      description: options.description
    });

    const transaction = new DB.Transaction({
      userId: options.userId,
      type: options.type,
      price: options.price,
      description: options.description,
      products: options.products || [{
        id: options.itemId,
        price: options.price,
        description: options.description
      }],
      paymentGateway: options.gateway,
      paymentId: data.id,
      paymentToken: data.token,
      meta: Object.assign(options.meta, data),
      itemId: options.itemId,
      paymentResponse: data,
      status: 'completed'
    });

    await transaction.save();
    const invoiceData = transaction.toObject();
    delete invoiceData._id;
    const invoice = new DB.Invoice(invoiceData);
    invoice.transactionId = transaction._id;
    await invoice.save();

    // re update for order status if have
    if (transaction.type === 'order') {
      await Service.Order.updatePaid(options.itemId, transaction._id);
    } else if (transaction.type === 'shop_featured') {
      await Service.ShopFeatured.updateFeatured({
        userId: transaction.userId,
        packageId: transaction.itemId,
        transaction
      });
    }

    return data;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

exports.createDonation = async (options) => {
  try {

    const data = await Stripe.charge({
      amount: Math.round(options.price * 100),
      // for stripe must use lowercase
      currency: process.env.SITE_CURRENCY.toLowerCase(),
      source: options.stripeToken,
      description: options.description
    });

    const donation = new DB.Donation({
      name: options.name,
      userId: options.userId,
      amount: options.price,
      transactionId: data.id,
    });

    await donation.save()

    return data;
  } catch (e) {
    console.log(e);
    throw e;
  }
}

exports.getDonations = async (options) => {
  try {
    
    console.log(options)

    if (options.role === 'user') {

      const page = Math.max(0, options.page - 1) || 0; // using a zero-based page index for use with skip()
      const take = parseInt(options.take, 10) || 10;
      
      const sort = Helper.App.populateDBSort(options);
      let count = await DB.Donation.count({ userId: options.userId });
      let data = await DB.Donation.find({ userId: options.userId })
        .sort(sort)
        .skip((page) * take)
        .limit(page * take)
        .exec();

      return {
        data: data,
        count: count
      };

    } else {
      const page = Math.max(0, options.page - 1) || 0; // using a zero-based page index for use with skip()
      const take = parseInt(options.take, 10) || 10;
      
      const sort = Helper.App.populateDBSort(options);
      let count = await DB.Donation.count();
      let data = await DB.Donation.find()
        .sort(sort)
        .skip((page) * take)
        .limit(page * take)
        .exec();

      return {
        data: data,
        count: count
      };
     
      return {
        data: data,
        count: count
      };
    }

  } catch (e) {
    throw e;
  }
}

exports.createBraintreeSinglePayment = async (options) => {
  try {
    const data = await Braintree.charge(options.braintreeNonce, options.price);

    const transaction = new DB.Transaction({
      userId: options.userId,
      type: options.type,
      price: options.price,
      description: options.description,
      products: options.products || [{
        id: options.itemId,
        price: options.price,
        description: options.description
      }],
      paymentGateway: options.gateway,
      paymentId: data.id,
      paymentToken: data.token,
      meta: Object.assign(options.meta, data),
      itemId: options.itemId,
      paymentResponse: data,
      status: 'completed'
    });

    await transaction.save();
    const invoiceData = transaction.toObject();
    delete invoiceData._id;
    const invoice = new DB.Invoice(invoiceData);
    invoice.transactionId = transaction._id;
    await invoice.save();

    // re update for order status if have
    if (transaction.type === 'order') {
      await Service.Order.updatePaid(options.itemId, transaction._id);
    }

    return data;
  } catch (e) {
    throw e;
  }
};

exports.createSinglePayment = async (options) => {
  try {
    if (options.gateway === 'paypal') {
      return this.createPaypalSinglePayment(options);
    } else if (options.gateway === 'stripe') {
      return this.createStripeSinglePayment(options);
    } else if (options.gateway === 'braintree') {
      return this.createBraintreeSinglePayment(options);
    }

    throw new Error('Not support other gateway yet');
  } catch (e) {
    throw e;
  }
};

exports.executePaypalSinglePayment = async (transaction, options) => {
  try {
    if (transaction.paymentGateway !== 'paypal') {
      throw new Error('Not support yet');
    }

    const paymentOptions = {
      config: {
        mode: process.env.PAYPAL_MODE,
        client_id: process.env.PAYPAL_CLIENT_ID,
        client_secret: process.env.PAYPAL_CLIENT_SECRET
      },
      payerId: options.PayerID,
      price: transaction.price,
      paymentId: transaction.paymentId
    };

    const data = await Paypal.executeSinglePayment(paymentOptions);
    transaction.paymentResponse = data;
    transaction.status = 'completed';
    await transaction.save();

    const invoiceData = transaction.toObject();
    delete invoiceData._id;
    const invoice = new DB.Invoice(invoiceData);
    invoice.transactionId = transaction._id;
    await invoice.save();

    if (transaction.type === 'order') {
      await Service.Order.updatePaid(transaction.itemId, transaction._id);
    } else if (transaction.type === 'shop_featured') {
      await Service.ShopFeatured.updateFeatured({
        userId: transaction.userId,
        packageId: transaction.itemId,
        transaction
      });
    }

    return data;
  } catch (e) {
    throw e;
  }
};


exports.createSellerPayout = async (options) => {
  try {

    let payoutRequetDetails = await DB.PayoutRequest.findOne({ _id: options.id });
    if (payoutRequetDetails) {
      console.log(payoutRequetDetails);
      if (payoutRequetDetails.status === 'approved' && (payoutRequetDetails.payoutTransactionID != 0 && payoutRequetDetails.payoutTransactionID != '')) {
        let result = {};
        result.status = 'false';
        result.message = "Payout is already made for this request";
        return result;
      }

      //payoutRequetDetails.payoutAccount.type = 'stripe';
      //payoutRequetDetails.payoutAccount.paypalAccount = 'acct_1EE47HC4mCXonm8v';
      if (payoutRequetDetails.payoutAccount.type === 'stripe') {

        //This is for remove unncessory account
        /*let accounts = await Stripe.accountsList({});
        console.log(accounts);
        let accountList = accounts.data;
        console.log(accountList);
        for(let val of accountList) {
          console.log(val)
          let deleted = Stripe.delAccounts(val.id);
        }*/

        let destination = payoutRequetDetails.payoutAccount.accountId;
        const payout = await Stripe.transferCreate({
          amount: Math.round(options.paidPayoutAmount * 100),
          currency: 'usd',
          destination: destination,
        });

        if (payout) {
          if (payout.status === 'paid') {
            payoutRequetDetails.payoutStatus = payout.status;
            payoutRequetDetails.paidPayoutAmount = options.paidPayoutAmount;
            payoutRequetDetails.payoutTransactionID = payout.balance_transaction;
            payoutRequetDetails.payoutAccountID = payout.destination;
            payoutRequetDetails.payoutPaymentID = payout.destination_payment;
            payoutRequetDetails.payoutTransferDetails = payout;
            payoutRequetDetails.save();
          }
        }
        return payout;
      }
      else if (payoutRequetDetails.payoutAccount.type === 'paypal') {
        const paymentOptions = options;
        paymentOptions.config = {
          mode: process.env.PAYPAL_MODE,
          client_id: process.env.PAYPAL_CLIENT_ID,
          client_secret: process.env.PAYPAL_CLIENT_SECRET
        };
        const billingPlan = await Paypal.do_payout(paymentOptions);
      }

    }
  } catch (e) {

    let result = {};
    result.status = 'false';
    result.message = e.message;
    return result;

  }
};
