const multer = require('multer');
const importController = require('../controllers/import-export.controller');
const config = require('../config');
const path = require('path');
const fs = require('fs');

const uploadFile = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, config.csvDir);
    },
    fileFilter(req, file, callback) {
      const ext = path.extname(file.originalname);
      if (!ext || ext.toLowerCase() !== 'csv') {
        return callback(new Error('Only csv is allowed'));
      }
      return callback(null, true);
    },
    filename(req, file, cb) {
      const ext = Helper.String.getExt(file.originalname);
      const nameWithoutExt = Helper.String.createAlias(Helper.String.getFileName(file.originalname, true));
      let fileName = `${nameWithoutExt}${ext}`;
      if (fs.existsSync(path.resolve(config.csvDir, fileName))) {
        fileName = `${nameWithoutExt}-${Helper.String.randomString(5)}${ext}`;
      }

      cb(null, fileName);
    },
    fileSize: (process.env.MAX_FILE_SIZE || 10) * 1024 * 1024 // 10MB limit
  })
});

module.exports = (router) => {
  /**
   * @apiGroup Export_Import
   * @apiVersion 1.0.0
   * @apiName Export product to csv
   * @api {get} /v1/products/export/csv
   * @apiDescription generate product to csv. add `access_token` in the query string for authenticated
   * @apiUse authRequest
   * @apiPermission seller
   */
  router.get(
    '/v1/products/export/csv',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    importController.toCsv
  );

  /**
   * @apiGroup Export_Import
   * @apiVersion 1.0.0
   * @apiName Import product from csv
   * @api {post} /v1/products/import/csv
   * @apiDescription Bulk upload product from csv file. Sample file can get in the export
   * @apiUse authRequest
   * @apiPermission seller
   */
  router.post(
    '/v1/products/import/csv',
    Middleware.isAuthenticated,
    Middleware.isAdminOrSeller,
    uploadFile.single('file'),
    importController.fromCsv,
    Middleware.Response.success('fromCsv')
  );
};
