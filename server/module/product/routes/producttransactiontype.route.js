const productTransactionTypeController = require('../controllers/producttransactiontype.controller');

module.exports = (router) => {
    /**
   * @apiDefine productTransactionTypeRequest
   * @apiParam {String}   name        product Transaction name
   * @apiParam {String}   status     For active and inactive
   **/

  router.get(
    '/v1/producttransactiontype/dropdown',
    productTransactionTypeController.findForDropdown,
    Middleware.Response.success('productTransactionType')
  );

  router.get(
    '/v1/producttransactiontype/:id',
    productTransactionTypeController.find,
    Middleware.Response.success('productTransactionDetails')
  );
}

