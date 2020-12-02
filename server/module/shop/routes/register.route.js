const fs = require('fs');
const path = require('path');
const multer = require('multer');
const config = require('../config');
const registerController = require('../controllers/register.controller');

const uploadDocument = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, config.documentDir);
    },
    filename(req, file, cb) {
      const ext = Helper.String.getExt(file.originalname);
      const nameWithoutExt = Helper.String.createAlias(Helper.String.getFileName(file.originalname, true));
      let fileName = `${nameWithoutExt}${ext}`;
      if (fs.existsSync(path.resolve(config.documentDir, fileName))) {
        fileName = `${nameWithoutExt}-${Helper.String.randomString(5)}${ext}`;
      }

      cb(null, fileName);
    },
    fileSize: 10 * 1024 * 1024 // 10MB limit
  })
});

module.exports = (router) => {
  /**
   * @apiGroup Shop
   * @apiVersion 1.0.0
   * @api {post} /v1/shops/register  Register a shop
   * @apiDescription Register a shop. allow for both unregistered and logged in user
   *                if user does not signin, we will check and verify this account in the db first
   * @apiUse authRequest
   * @apiParam {String}   email      email address. if user did not login, system will create account with this email
   * @apiParam {String}   [password]   password. min 6 characters. if user did not login, system will create account with this password
   * @apiParam {String}   name  Shop name
   * @apiParam {String}   address Shop address
   * @apiParam {String}   phoneNumber Shop phone number. if user did not login, system will create account with this phone number
   * @apiParam {String}   address Shop address. if user did not login, system will create account with this address
   * @apiParam {String}   city Shop city. if user did not login, system will create account with this city
   * @apiParam {String}   state Shop state. if user did not login, system will create account with this state
   * @apiParam {String}   country Shop country. if user did not login, system will create account with this country
   * @apiParam {String}   zipcode Shop zipcode. if user did not login, system will create account with this zipcode
   * @apiParam {String}   verificationIssueId mediaId - by using upload api
   *
   * @apiPermission admin
   */
  router.post(
    '/v1/shops/register',
    Middleware.loadUser,
    registerController.register,
    Middleware.Response.success('register')
  );

  /**
   * @apiGroup Shop
   * @apiVersion 1.0.0
   * @api {post} /v1/shops/register/document  Upload verification issue document
   * @apiDescription Upload a document for shop verification. Use multipart/form-data to upload file and add additional fields
   * @apiParam {Object}   file  file data
   * @apiPermission all
   */
  router.post(
    '/v1/shops/register/document',
    uploadDocument.single('file'),
    registerController.uploadDocument,
    Middleware.Response.success('document')
  );
};
