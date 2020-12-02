const multer = require('multer');

const uploadAvatar = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'public/avatar/');
    },
    filename(req, file, cb) {
      const fileName = Helper.String.randomString(5) + Helper.String.getExt(file.originalname);
      cb(null, fileName);
    }
  }),
  fileFilter:  (req, file, cb) => {
    if ( file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' ) { 
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

const userController = require('../controllers/user.controller');

module.exports = (router) => {
  /**
   * @apiDefine userCreateRequst
   * @apiParam {String}   email      email address
   * @apiParam {String}   password   password
   * @apiParam {String}   [name]
   * @apiParam {String}   [address]
   * @apiParam {String}   [phoneNumber]
   * @apiParam {Boolean}  [phoneVerified]
   * @apiParam {Boolean}  [emailVerified]
   */

  /**
   * @apiDefine userProfileResponse
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "role": "user",
   *        "provider": "local",
   *        "_id": "5b99da5989b54c53851fa66c",
   *        "type": "user",
   *        "isActive": true,
   *        "emailVerified": false,
   *        "phoneNumber": "",
   *        "phoneVerified": false,
   *        "address": "",
   *        "email": "tuongtest@yopmail.com",
   *        "createdAt": "2018-09-13T03:32:41.715Z",
   *        "updatedAt": "2018-09-13T03:32:41.715Z",
   *        "__v": 0,
   *        "avatarUrl": "http://url/to/default/avatar.jpg"
   *    },
   *    "error": false
   * }
   */

  /**
   * @apiGroup User
   * @apiVersion 1.0.0
   * @api {post} /v1/users  Create new user
   * @apiDescription Create new user
   * @apiUse authRequest
   * @apiUse userCreateRequst
   * @apiUse userProfileResponse
   * @apiPermission admin
   */
  router.post(
    '/v1/users',
    Middleware.hasRole('admin'),
    userController.create,
    Middleware.Response.success('user')
  );

  /**
   * @apiGroup User
   * @apiVersion 1.0.0
   * @api {post} /v1/users/:id/avatar  Change user avatar
   * @apiDescription Change user avatar. Use multipart/formdata
   * @apiUse authRequest
   * @apiParam {Object}  avatar file data
   *
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "url": "http://url/to/avatar.jpg"
   *    },
   *    "error": false
   * }
   * @apiPermission admin
   */
  router.post(
    '/v1/users/:id/avatar',
    Middleware.hasRole('admin'),
    uploadAvatar.single('avatar'),
    userController.updateAvatar,
    Middleware.Response.success('updateAvatar')
  );

  /**
   * @apiGroup User
   * @apiVersion 1.0.0
   * @api {post} /v1/users/avatar  Change current user avatar
   * @apiDescription Change user avatar. Use multipart/formdata
   * @apiUse authRequest
   * @apiParam {Object}  avatar file data
   *
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "url": "http://url/to/avatar.jpg"
   *    },
   *    "error": false
   * }
   * @apiPermission user
   */
  router.post(
    '/v1/users/avatar',
    Middleware.isAuthenticated,
    uploadAvatar.single('avatar'),
    userController.updateAvatar,
    Middleware.Response.success('updateAvatar')
  );

  /**
   * @apiGroup User
   * @apiVersion 1.0.0
   * @api {put} /v1/users Update current user profile
   * @apiDescription Update profile
   * @apiUse authRequest
   * @apiUse userCreateRequst
   * @apiUse userProfileResponse
   * @apiPermission admin
   */
  router.put(
    '/v1/users',
    Middleware.isAuthenticated,
    userController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup User
   * @apiVersion 1.0.0
   * @api {post} /v1/users/:id Update profile
   * @apiDescription Update profile
   * @apiUse authRequest
   * @apiUse userCreateRequst
   * @apiUse userProfileResponse
   * @apiPermission admin
   */
  router.put(
    '/v1/users/:id',
    Middleware.hasRole('admin'),
    userController.update,
    Middleware.Response.success('update')
  );

  /**
   * @apiGroup User
   * @apiVersion 1.0.0
   * @api {get} /v1/users/me Get my profile
   * @apiDescription get current profle of logged in user
   * @apiUse authRequest
   * @apiUse userProfileResponse
   * @apiPermission user
   */
  router.get(
    '/v1/users/me',
    Middleware.isAuthenticated,
    // Middleware.checkPlatform,
    userController.me,
    Middleware.Response.success('me')
  );

  /**
   * @apiGroup User
   * @apiVersion 1.0.0
   * @api {get} /v1/users/search?:name&:phoneNumber&:isActive&:phoneVerified&:emailVerified&:role Search users
   * @apiDescription Search users
   * @apiUse authRequest
   * @apiParam {String}   [name]
   * @apiParam {String}   [phoneNumber]
   * @apiParam {Boolean}  [isActive]
   * @apiParam {Boolean}  [phoneVerified]
   * @apiParam {Boolean}  [emailVerified]
   * @apiParam {String}   [role]
   *
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "count": 10,
   *        "items": [
   *            "role": "user",
   *            "provider": "local",
   *            "_id": "5b99da5989b54c53851fa66c",
   *            "type": "user",
   *            "isActive": true,
   *            "emailVerified": false,
   *            "phoneNumber": "",
   *            "phoneVerified": false,
   *            "address": "",
   *            "email": "tuongtest@yopmail.com",
   *            "createdAt": "2018-09-13T03:32:41.715Z",
   *            "updatedAt": "2018-09-13T03:32:41.715Z",
   *            "__v": 0,
   *            "avatarUrl": "http://url/to/default/avatar.jpg"
   *        ]
   *    },
   *    "error": false
   * }
   * @apiPermission admin
   */
  router.get(
    '/v1/users/search',
    Middleware.hasRole('admin'),
    userController.search,
    Middleware.Response.success('search')
  );

  /**
   * @apiGroup User
   * @apiVersion 1.0.0
   * @api {get} /v1/users/:id Get user profile
   * @apiDescription Get public user profile
   * @apiUse authRequest
   * @apiParam {String}   [id]      user id
   * @apiUse userProfileResponse
   * @apiPermission user
   */
  router.get(
    '/v1/users/:id',
    Middleware.isAuthenticated,
    userController.findOne,
    Middleware.Response.success('user')
  );

  /**
   * @apiGroup User
   * @apiVersion 1.0.0
   * @api {delete} /v1/users/:id Delete user
   * @apiDescription Delete user profile. just allow for non-admin user
   * @apiUse authRequest
   * @apiParam {String}   [id]      user id
   *
   * @apiSuccessExample {json} Response-Success
   * {
   *    "code": 200,
   *    "message": "OK",
   *    "data": {
   *        "success": true
   *    },
   *    "error": false
   * }
   * @apiPermission admin
   */
  router.delete(
    '/v1/users/:userId',
    Middleware.hasRole('admin'),
    userController.remove,
    Middleware.Response.success('remove')
  );


  /**
   * @apiGroup User
   * @apiVersion 1.0.0
   * @api {get} /v1/users/generateAutologinToken Generate auto login token
   * @apiDescription This is to generate auto login token
   * @apiUse authRequest
   * @apiUse userProfileResponse
   * @apiPermission user
   */
  router.post(
    '/v1/users/generate-token/',
    // Middleware.checkPlatform,
    userController.generateToken,
    Middleware.Response.success('token')
  );



  /**
   * @apiGroup User
   * @apiVersion 1.0.0
   * @api {get} /v1/users/generateAutologinToken Generate auto login token
   * @apiDescription This is to generate auto login token
   * @apiUse authRequest
   * @apiUse userProfileResponse
   * @apiPermission user
   */
  router.post(
    '/v1/users/generatetoken/',
    // Middleware.checkPlatform,
    userController.generatetoken,
    Middleware.Response.success('token')
  );


  /**
   * @apiGroup User
   * @apiVersion 1.0.0
   * @api {get} /v1/users/token Get user detials from autologin Token
   * @apiDescription Get user detials from autologin Token
   * @apiUse authRequest
   * @apiUse userProfileResponse
   * @apiPermission user
   */
  router.delete(
    '/v1/user/token/:token',
    userController.deleteAutoLoginToken,
    Middleware.Response.success('token')
  );
};
