const productTypeController = require('../controllers/producttype.controller');

module.exports = (router) => {
    /**
   * @apiDefine productTransactionTypeRequest
   * @apiParam {String}   name        product Transaction name
   * @apiParam {String}   status     For active and inactive
   **/

  router.get(
    '/v1/producttype/dropdown',
    productTypeController.findForDropdown,
    Middleware.Response.success('productType')
  );

}

