const Csv = require('json2csv').Transform;
const Readable = require('stream').Readable;
const moment = require('moment');
const path = require('path');
const fs = require('fs');

exports.toCsv = async (req, res, next) => {
  try {
    const csvData = await Service.Product.getProductsCsv(req.user.shopId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-disposition', `attachment; filename=${req.query.fileName || 'products'}.csv`);
    const readStream = new Readable();
    const stringData = JSON.stringify(csvData);
    const json2csv = new Csv({
      fields: [{
        label: 'Name',
        value: 'name'
      }, {
        label: 'Alias',
        value: 'alias'
      }, {
        label: 'Product parent',
        value: 'parent'
      }, {
        label: 'Category',
        value: row => (row.categoryName || '')
      }, {
        label: 'Short description',
        value: 'shortDescription'
      }, {
        label: 'Description',
        value: 'description'
      }, {
        label: 'Variant uuid',
        value: 'uuid'
      }, {
        label: 'Variant options',
        value: (row) => {
          if (row.productType !== 'Variant' || !row.options || !row.options.length) {
            return '';
          }
          const text = row.options.map(option => `${(option.displayText || option.key)}:${option.value}`);
          return text.join(' || ');
        }
      }, {
        label: 'Specifications',
        value: (row) => {
          if (!row.specifications || !row.specifications.length) {
            return '';
          }
          const text = row.specifications.map(option => `${option.key}:${option.value}`);
          return text.join(' || ');
        }
      }, {
        label: 'Type',
        value: 'type'
      }, {
        label: 'Price',
        value: row => (row.price || 0)
      }, {
        label: 'Sale price',
        value: row => (row.salePrice || 0)
      }, {
        label: 'Stock quantity',
        value: row => (row.stockQuantity || 0)
      }, {
        label: 'Active',
        value: row => (row.isActive ? 'Y' : 'N')
      }, {
        label: 'SKU',
        value: row => (row.sku || '')
      }, {
        label: 'UPC',
        value: row => (row.upc || '')
      }, {
        label: 'MPN',
        value: row => (row.mpn || '')
      }, {
        label: 'EAN',
        value: row => (row.ean || '')
      }, {
        label: 'JAN',
        value: row => (row.jan || '')
      }, {
        label: 'ISBN',
        value: row => (row.isbn || '')
      }, {
        label: 'Tax class',
        value: row => (row.taxClass || '')
      }, {
        label: 'Tax percentage',
        value: row => (row.taxPercentage || '')
      }, {
        label: 'Free ship',
        value: row => (row.freeShip ? 'Y' : 'N')
      }, {
        label: 'Daily deal',
        value: row => (row.dailyDeal ? 'Y' : 'N')
      }, {
        label: 'Deal to',
        value: row => (row.dailyDeal && row.dealTo ? moment(row.dealTo).format('DD/MM/YYYY') : '')
      }, {
        label: 'Meta keywords',
        value: row => (row.metaSeo ? row.metaSeo.keywords : '')
      }, {
        label: 'Meta description',
        value: row => (row.metaSeo ? row.metaSeo.description : '')
      }],
      header: true
    }, {
      highWaterMark: 16384,
      encoding: 'utf-8'
    });
    readStream._read = () => {};
    // TODO: Reduce the pace of pushing data here
    readStream.push(stringData);
    readStream.push(null);
    readStream.pipe(json2csv).pipe(res);
  } catch (e) {
    next(e);
  }
};

exports.fromCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(PopulateResponse.error({
        message: 'Missing file!'
      }, 'ERR_MISSING_FILE'));
    }

    const csvPath = path.resolve(req.file.path);
    await Service.Product.importCsv(req.user.shopId, csvPath);

    // remove
    fs.unlinkSync(csvPath);

    res.locals.fromCsv = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};
