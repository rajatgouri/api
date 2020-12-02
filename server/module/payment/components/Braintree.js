const braintree = require('braintree');

exports.getGateway = async () => {
  try {
    return braintree.connect({
      environment: process.env.BRAINTREE_MODE === 'sandbox' ? braintree.Environment.Sandbox : braintree.Environment.Production,
      // Use your own credentials from the sandbox Control Panel here
      merchantId: process.env.BRAINTREE_MERCHANT_ID,
      publicKey: process.env.BRAINTREE_PUBLIC_KEY,
      privateKey: process.env.BRAINTREE_PRIVATE_KEY
    });
  } catch (e) {
    throw e;
  }
};

exports.generateClientToken = async () => {
  try {
    const gateway = await this.getGateway();

    // Use the payment method nonce here
    return gateway.clientToken.generate();
  } catch (e) {
    throw e;
  }
};

exports.charge = async (nonce, amount) => {
  try {
    const gateway = await this.getGateway();
    return gateway.transaction.sale({
      // TODO - should check currency setting
      amount: parseFloat(amount).toFixed(2),
      // like tokencc_bj_kbsdc2_mr3wq5_956pf7_yx4b4h_s43
      paymentMethodNonce: nonce,
      options: {
        // This option requests the funds from the transaction
        // once it has been authorized successfully
        submitForSettlement: true
      }
    });
  } catch (e) {
    throw e;
  }
};

