const optionController = require('../controllers/options.controller');

module.exports = (router) => {
  /**
   * @apiDefine optionRequest
   * @apiParam {String}   name Option name
   * @apiParam {String}   key Unique key for searching in system. `_custom` is not allowed
   * @apiParam {Object[]}   options Option array data with `key` and `displayText`
   * @apiParam {String}   options.key unique key for option value
   * @apiParam {String}   options.displayText Text will be shown in the frontend
   */

  /**
   * @apiGroup Product Option
   * @apiVersion 1.0.0
   * @api {get} /v1/products/options?:name&:key  Get list options
   * @apiDescription Get list options
   * @apiParam {String}   [name]      option name
   * @apiParam {String}   [key]     option key
   * @apiPermission all
   */
  router.get(
    '/v1/products/options',
    optionController.list,
    Middleware.Response.success('optionList')
  );

  /**
   * @apiGroup Product Option
   * @apiVersion 1.0.0
   * @api {post} /v1/products/options  Create new option
   * @apiDescription Create new option
   * @apiUse authRequest
   * @apiUse optionRequest
   * @apiPermission superadmin
   */
  router.post(
    '/v1/products/options',
    Middleware.hasRole('admin'),
    optionController.create,
    Middleware.Response.success('option')
  );

  /**
   * @apiGroup Product Option
   * @apiVersion 1.0.0
   * @api {put} /v1/products/options/:id  Update a option
   * @apiDescription Update a option
   * @apiUse authRequest
   * @apiUse optionRequest
   * @apiPermission superadmin
   */
  router.put(
    '/v1/products/options/:id',
    Middleware.hasRole('admin'),
    optionController.findOne,
    optionController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup Product Option
   * @apiVersion 1.0.0
   * @api {delete} /v1/products/options/:id Remove a option
   * @apiDescription Remove a option
   * @apiUse authRequest
   * @apiParam {String}   id        Option id
   * @apiPermission superadmin
   */
  router.delete(
    '/v1/products/options/:id',
    Middleware.hasRole('admin'),
    optionController.findOne,
    optionController.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup Product Option
   * @apiVersion 1.0.0
   * @api {get} /v1/products/options/:id Get option details
   * @apiDescription Get option details
   * @apiParam {String}   id        Option id
   * @apiPermission all
   */
  router.get(
    '/v1/products/options/:id',
    optionController.findOne,
    Middleware.Response.success('option')
  );
};
