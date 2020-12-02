const productController = require('../controllers/product.controller');

module.exports = (router) => {
  /**
   * @apiDefine productRequest
   * @apiParam {String}   name        product name
   * @apiParam {String}   [alias]     Alias name. Or will be generated from name automatically
   * @apiParam {String}   [description]
   * @apiParam {String}   [shortDescription]
   * @apiParam {String}   [type] `physical` or `digital`. Default is `physical`
   * @apiParam {Number}   [price]
   * @apiParam {Number}   [salePrice]
   * @apiParam {Number}   [stockQuantity]
   * @apiParam {String}   [categoryId]
   * @apiParam {String}   [brandId]
   * @apiParam {String}   [sku] stock keeping unit
   * @apiParam {String}   [upc] univeral product code
   * @apiParam {String}   [mpn] manufater part number
   * @apiParam {String}   [ean] european article number
   * @apiParam {String}   [jan] japanese artical number
   * @apiParam {String}   [isbn] international standard book number
   * @apiParam {Boolean}   [isActive] Flag to active / show product in frontend
   * @apiParam {String}   [mainImage] media id. if it is not set and images is not empty, will get first images
   * @apiParam {String[]}   [images] media id
   * @apiParam {Object[]}   [specifications] `[{key, value}]`
   * @apiParam {String}   [specifications.key] special keys
   * @apiParam {String}   [specifications.value] special value
   * @apiParam {Boolean}   [featured=false] allow for admin user only
   * @apiParam {Boolean}   [isActive=true]
   * @apiParam {String}   [taxClass] eg VAT
   * @apiParam {Number}   [taxPercentage] eg 10 (in percentage)
   * @apiParam {String}   [digitalFileId] Media id for digital file
   * @apiParam {String[]}   [restrictCODAreas] array of zip code seller can entered
   * @apiParam {Boolean}   [freeShip] Freeship checkbox. Default is `true`
   * @apiParam {Object[]}   [restrictFreeShipAreas] array of area which allow freeship
   * @apiParam {String}   [restrictFreeShipAreas.areaType] `zipcode`, `city`, `state`, `country`
   * @apiParam {String}   [restrictFreeShipAreas.value] zipcode or city id, state id, country iso code
   * @apiParam {Boolean} [dailyDeal] daily deal option. Default is `false`
   * @apiParam {String} [dealTo] daily deal date format. Time for this deal
   * @apiParam {Object}   [metaSeo] `{keywords, description}`
   */

  /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {get} /v1/products?:name&&:q&:sort&:sortType&:page&:take  Get list products
   * @apiDescription Get list products
   * @apiParam {String}   [name]      product name
   * @apiParam {String}   [shortDescription]      product description
   * @apiParam {String}   [q] search all allowed fields
   * @apiParam {Number}   [take] Response item. defaultl `10`
   * @apiParam {Number}   [page] page should take from
   * @apiParam {String}   [sort] field to sort. or `random`
   * @apiParam {String}   [sortType] `desc` or `asc`
   * @apiPermission all
   */
  router.get(
    '/v1/products',
    Middleware.loadUser,
    productController.search,
    Middleware.Response.success('search')
  );


   /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {get} /v1/products?:name&&:q&:sort&:sortType&:page&:take  Get list products
   * @apiDescription Get list products
   * @apiParam {String}   [name]      product name
   * @apiParam {String}   [shortDescription]      product description
   * @apiParam {String}   [q] search all allowed fields
   * @apiParam {Number}   [take] Response item. defaultl `10`
   * @apiParam {Number}   [page] page should take from
   * @apiParam {String}   [sort] field to sort. or `random`
   * @apiParam {String}   [sortType] `desc` or `asc`
   * @apiPermission all
   */
  router.post(
    '/v1/products/publish',
    Middleware.loadUser,
    productController.publish,
    Middleware.Response.success('publish')
  );


  /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {get} /v1/products/search?:name&brandId&:shopId&&:q&dailyDeal&discounted&bestSell&soldOut&:sort&:sortType&:page&:take  Get list products
   * @apiDescription Get list products
   * @apiParam {String}   [name]      product name
   * @apiParam {String}   [shortDescription]      product description
   * @apiParam {String}   [q] search all allowed fields
   * @apiParam {Number}   [take] Response item. defaultl `10`
   * @apiParam {Number}   [page] page should take from
   * @apiParam {String}   [sort] field to sort. or `random`
   * @apiParam {String}   [sortType] `desc` or `asc`
   * @apiParam {String}   [brandId]
   * @apiParam {String}   [shopId]
   * @apiParam {Boolean}  [dailyDeal]
   * @apiParam {Boolean}  [discounted]
   * @apiParam {Boolean}  [bestSell]
   * @apiParam {Boolean}  [soldOut]
   * @apiPermission all
   */
  router.get(
    '/v1/products/search',
    Middleware.loadUser,
    productController.search,
    Middleware.Response.success('search')
  );

  /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {post} /v1/products  Create new product
   * @apiDescription Create new product
   * @apiUse authRequest
   * @apiUse productRequest
   * @apiPermission superadmin
   */
  router.post(
    '/v1/products',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    productController.create,
    Middleware.Response.success('product')
  );


    /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {post} /v1/products  Create new product
   * @apiDescription Create new product
   * @apiUse authRequest
   * @apiUse productRequest
   * @apiPermission superadmin
   */
  router.post(
    '/v1/products/areaAvailability',
    productController.areaAvailability,
    Middleware.Response.success('distance')
  );



  /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {put} /v1/products/:id  Update a product
   * @apiDescription Update a product
   * @apiUse authRequest
   * @apiUse productRequest
   * @apiPermission superadmin
   */
  router.put(
    '/v1/products/:id',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    productController.findOne,
    productController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {delete} /v1/products/:id Remove a brand
   * @apiDescription Remove a product
   * @apiUse authRequest
   * @apiParam {String}   id        Brand id
   * @apiPermission superadmin
   */
  router.delete(
    '/v1/products/:id',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    productController.findOne,
    productController.remove,
    Middleware.Response.success('remove')
  );

  /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {get} /v1/products/:id Get product details
   * @apiDescription Get product details
   * @apiParam {String}   id        product id
   * @apiPermission all
   */
  router.get(
    '/v1/products/:id',
    Middleware.loadUser,
    productController.details,
    Middleware.Response.success('product')
  );

  /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {get} /v1/products/:productId/related Get related products
   * @apiDescription Get related products by product category
   * @apiParam {String}   productId        product id
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": [
   *         "_id": "....",
   *         "name": "product name",
   *         "..." : "..."
   *     ],
   *     "error": false
   *  }
   * @apiPermission all
   */
  router.get(
    '/v1/products/:productId/related',
    productController.findOne,
    productController.related,
    Middleware.Response.success('items')
  );

  /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {post} /v1/products/alias/check Check alias
   * @apiDescription Check alias is exist or not
   * @apiParam {String} alias
   * @apiSuccessExample {json} Success-Response:
   *  {
   *     "code": 200,
   *     "message": "OK",
   *     "data": {
   *         "exist": true
   *     },
   *     "error": false
   *  }
   * @apiPermission seller
   */
  router.post(
    '/v1/products/alias/check',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    productController.checkAlias,
    Middleware.Response.success('checkAlias')
  );


  /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {get} /v1/products/:id Get product available for that date for rent and share
   * @apiDescription Get product check availability
   * @apiParam {String}   id        product id
   * * @apiParam {Date}   startDate        StartDate
   * * @apiParam {Date}   endDate        EndDate
   * @apiPermission all
   */
  router.post(
    '/v1/products/availability',
    Middleware.loadUser,
    productController.availability,
    Middleware.Response.success('productAvailable')
  );

  /**
   * @apiGroup Product
   * @apiVersion 1.0.0
   * @api {get} /v1/products/:id Get booked order for this product
   * @apiDescription Get all order booked for this product
   * @apiParam {String}   id        product id
   * @apiPermission all
   */
  router.post(
    '/v1/products/orders',
    Middleware.loadUser,
    productController.getProductOrders,
    Middleware.Response.success('orderdetails')
  );
};
