const donationController = require('../controllers/donations.controller');

module.exports = (router) => {
  

  
  /**
   * @apiGroup Donation
   * @apiVersion 1.0.0
   * @apiName Create transaction
   * @api {post} /v1/payment/transactions/donation  Create  Donation
   * @apiDescription create transaction and get redirect url
   * @apiUse transactionDonate
   * @apiPermission user
   */
  router.post(
    '/v1/payment/donations/donate',
    Middleware.loadUser,
    donationController.donate,
    Middleware.Response.success('request')
  );



    /**
   * @apiGroup Donation
   * @apiVersion 1.0.0
   * @apiName Create transaction
   * @api {post} /v1/payment/transactions/donation  Create  Donation
   * @apiDescription create transaction and get redirect url
   * @apiUse transactionDonate
   * @apiPermission user
   */
  router.post(
    '/v1/payment/donations/get-donations',
    Middleware.loadUser,
    donationController.getDonations,
    Middleware.Response.success('donations')
  );


  
};
