const shopController = require('../controllers/shop.controller');

module.exports = (router) => {
  /**
   * @apiGroup Shop
   * @apiVersion 1.0.0
   * @api {get} /v1/shops/me  Get shop of current user
   * @apiDescription Get shop of current user
   *
   * @apiUse authRequest
   * @apiPermission user
   */
  router.get(
    '/v1/shops/me',
    Middleware.isAuthenticated,
    shopController.getUserShop,
    Middleware.Response.success('shop')
  );


  /**
   * @apiGroup Shop
   * @apiVersion 1.0.0
   * @apiName Find shops
   * @api {get} /v1/shops/search?page&take&name&address&city&state&zipcode&returnAddress&latitude&longitude&distance
   * @apiDescription Search shops by confition.
   * @apiParam {String}   [name] shop name
   * @apiParam {String}   [address] shop address
   * @apiParam {String}   [city] shop city
   * @apiParam {String}   [state] shop state
   * @apiParam {String}   [zipcode] shop zipcode
   * @apiParam {String}   [returnAddress] shop return address
   * @apiParam {String}   [q] search all allowed fields
   * @apiParam {Number}   [take] Response item. defaultl `10`
   * @apiParam {Number}   [page] page should take from
   * @apiParam {String}   [sort] field to sort. or `random`
   * @apiParam {String}   [sortType] `desc` or `asc`
   * @apiParam {Number}   [latitude]
   * @apiParam {Number}   [longitude]
   * @apiParam {Number}   [distance] in km. If not provide, will search all
   * @apiDescription Find shops
   *
   * @apiPermission all
   */
  router.get(
    '/v1/shops/search',
    Middleware.loadUser,
    shopController.search,
    Middleware.Response.success('search')
  );

  /**
   * @apiGroup Shop
   * @apiVersion 1.0.0
   * @api {get} /v1/shops/:id  Get shop by id or alias
   * @apiDescription Get shop details
   *
   * @apiPermission all
   */
  router.get(
    '/v1/shops/:shopId',
    Middleware.loadUser,
    shopController.details,
    Middleware.Response.success('shop')
  );

  /**
   * @apiGroup Shop
   * @apiVersion 1.0.0
   * @api {post} /v1/shops  Create shop
   * @apiUse authRequest
   * @apiDescription Create a new shop
   *
   * @apiParam {String}   ownerId userId
   * @apiParam {String}   email      email address of shop
   * @apiParam {String}   name  Shop name
   * @apiParam {String}   address Shop address
   * @apiParam {String}   [phoneNumber] Shop phone number
   * @apiParam {String}   [city] Shop city
   * @apiParam {String}   [state] Shop state
   * @apiParam {String}   [country] Shop country
   * @apiParam {String}   [zipcode] Shop zipcode
   * @apiParam {String}   [verificationIssueId] mediaId - by using upload api
   * @apiParam {String}   [logoId] mediaId - media id by upload
   * @apiParam {String}   [bannerId] mediaId - media id by upload
   * @apiParam {String}   [returnAddress]
   * @apiParam {Number[]} [location] array `[longitude, latitude]` of geo location
   * @apiParam {Object}   [businessInfo] `{name, identifier, address}`
   * @apiParam {Object}   [bankInfo] bank information
   * @apiParam {Object}   [bankInfo.bankName]
   * @apiParam {Object}   [bankInfo.swiftCode]
   * @apiParam {Object}   [bankInfo.bankId]
   * @apiParam {Object}   [bankInfo.bankBranchId]
   * @apiParam {Object}   [bankInfo.bankBranchName]
   * @apiParam {Object}   [bankInfo.accountNumber]
   * @apiParam {Object}   [bankInfo.accountName]
   * @apiParam {Object}   [socials] `{facebook, twitter, google, linkedin, youtube, instagram, flickr}`
   *                                object with key is social provider and value is url string to social profile
   * @apiParam {Boolean}   [verified] Just available for `admin` role
   * @apiParam {Boolean}   [activated] Just available for `admin` role
   * @apiParam {Boolean}   [featured] Just available for `admin` role
   * @apiParam {String}   [featuredTo] Just available for `admin` role
   * @apiParam {String}   [gaCode] Google anyalytics code.
   * @apiParam {String}   [headerText] Custom header text
   * @apiParam {Object}   [notifications] Notification settings
   * @apiParam {Boolean}   [notifications.lowInventory] Low inventory setting
   * @apiParam {Boolean}  [storeWideShipping] Store wide setting. use if not set in the product
   * @apiParam {Object}   [shippingSettings] Setting for store-wide shipping
   * @apiParam {Number}   [shippingSettings.defaultPrice] default price
   * @apiParam {Number}   [shippingSettings.perProductPrice] Additional price for product
   * @apiParam {Number}   [shippingSettings.perQuantityPrice] Additional price for each product quantity
   * @apiParam {String}   [shippingSettings.processingTime] Processing time in day `one2Three`, `Four2Five`,
   *                                                        `Five2Eight`, `other`
   * @apiParam {String}   [shippingSettings.shippingPolicy] text for shop policy
   * @apiParam {String}   [shippingSettings.refundPolicy] text for custom refund policy
   * @apiParam {String}   [shippingSettings.shipFrom] Country for shipping location. Use `alpha2` code
   * @apiParam {String}   [announcement] announcement for shop which show in the user side
   * @apiPermission admin
   */
  router.post(
    '/v1/shops',
    Middleware.hasRole('admin'),
    shopController.create,
    Middleware.Response.success('create')
  );

  /**
   * @apiGroup Shop
   * @apiVersion 1.0.0
   * @api {put} /v1/shops/:id  Update shop
   * @apiUse authRequest
   * @apiDescription Update shop
   *
   * @apiParam {String}   [email]      email address of shop
   * @apiParam {String}   [name]  Shop name
   * @apiParam {String}   [address] Shop address
   * @apiParam {String}   [phoneNumber] Shop phone number
   * @apiParam {String}   [city] Shop city
   * @apiParam {String}   [state] Shop state
   * @apiParam {String}   [country] Shop country
   * @apiParam {String}   [zipcode] Shop zipcode
   * @apiParam {String}   [verificationIssueId] mediaId - by using upload api
   * @apiParam {String}   [logoId] mediaId - media id by upload
   * @apiParam {String}   [bannerId] mediaId - media id by upload
   * @apiParam {String}   [returnAddress]
   * @apiParam {Number[]} [location] array `[longitude, latitude]` of geo location
   * @apiParam {Object}   [businessInfo] `{name, identifier, address}`
   * @apiParam {Object}   [bankInfo] bank information
   * @apiParam {Object}   [bankInfo.bankName]
   * @apiParam {Object}   [bankInfo.swiftCode]
   * @apiParam {Object}   [bankInfo.bankId]
   * @apiParam {Object}   [bankInfo.bankBranchId]
   * @apiParam {Object}   [bankInfo.bankBranchName]
   * @apiParam {Object}   [bankInfo.accountNumber]
   * @apiParam {Object}   [bankInfo.accountName]
   * @apiParam {Object}   [socials] `{facebook, twitter, google, linkedin, youtube, instagram, flickr}`
   *                                object with key is social provider and value is url string to social profile
   * @apiParam {Boolean}   [verified] Just available for `admin` role
   * @apiParam {Boolean}   [activated] Just available for `admin` role
   * @apiParam {Boolean}   [featured] Just available for `admin` role
   * @apiParam {String}   [featuredTo] Just available for `admin` role
   * @apiParam {String}   [gaCode] Google anyalytics code.
   * @apiParam {String}   [headerText] Custom header text
   * @apiParam {Object}   [notifications] Notification settings
   * @apiParam {Boolean}   [notifications.lowInventory] Low inventory setting
   * @apiParam {Boolean}  [storeWideShipping] Store wide setting. use if not set in the product
   * @apiParam {Object}   [shippingSettings] Setting for store-wide shipping
   * @apiParam {Number}   [shippingSettings.defaultPrice] default price
   * @apiParam {Number}   [shippingSettings.perProductPrice] Additional price for product
   * @apiParam {Number}   [shippingSettings.perQuantityPrice] Additional price for each product quantity
   * @apiParam {String}   [shippingSettings.processingTime] Processing time in day `one2Three`, `Four2Five`,
   *                                                        `Five2Eight`, `other`
   * @apiParam {String}   [shippingSettings.shippingPolicy] text for shop policy
   * @apiParam {String}   [shippingSettings.refundPolicy] text for custom refund policy
   * @apiParam {String}   [shippingSettings.shipFrom] Country for shipping location. Use `alpha2` code
   * @apiParam {String}   [announcement] announcement for shop which show in the user side
   * @apiPermission seller
   */
  router.put(
    '/v1/shops/:shopId',
    Middleware.isAuthenticated,
    shopController.update,
    Middleware.Response.success('update')
  );
};
