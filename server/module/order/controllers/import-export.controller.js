const Csv = require('json2csv').Transform;
const Readable = require('stream').Readable;
const moment = require('moment');

exports.toCsv = async (req, res, next) => {
  try {
    const query = Helper.App.populateDbQuery(req.query, {
      equal: ['status', 'paymentMethod']
    });
    if (req.user.role !== 'admin') {
      query.shopId = req.user.shopId;
    } else if (req.query.shopId) {
      query.shopId = req.query.shopId;
    }

    if (req.query.startDate) {
      query.createdAt = { $gte: moment(req.query.startDate).toDate() };
    }
    if (req.query.toDate) {
      if (query.createdAt) {
        query.createdAt.$lte = moment(req.query.toDate).toDate();
      } else {
        query.createdAt = { $lte: moment(req.query.toDate).toDate() };
      }
    }

    const csvData = await Service.Order.getCsvData(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-disposition', `attachment; filename=${req.query.fileName || 'orders'}.csv`);
    const readStream = new Readable();
    const stringData = JSON.stringify(csvData);
    const json2csv = new Csv({
      fields: [{
        label: 'Product',
        value: 'productDetails.name'
      }, {
        label: 'Variants',
        value: (row) => {
          if (!row.variantDetails || !row.variantDetails.options || !row.variantDetails.options.length) {
            return '';
          }
          const text = [];
          row.variantDetails.options.forEach(v => text.push(`${(v.displayText || v.key)}: ${v.value}`));
          return text.join('; ');
        }
      }, {
        label: 'Quantity',
        value: row => (row.quantity || 0)
      }, {
        label: 'Unit price',
        value: row => (row.unitPrice || '')
      }, {
        label: 'Total price',
        value: row => (row.totalPrice || '')
      }, {
        label: 'Status',
        value: row => (row.status || '')
      }, {
        label: 'Tax price',
        value: row => (row.taxPrice || 0)
      }, {
        label: 'User note',
        value: row => (row.userNote || '')
      }, {
        label: 'Email',
        value: row => (row.email || '')
      }, {
        label: 'First Name',
        value: row => (row.firstName || '')
      }, {
        label: 'lastName',
        value: row => (row.lastName || '')
      }, {
        label: 'Street',
        value: row => (row.streetAddress | '')
      }, {
        label: 'City',
        value: row => (row.city || '')
      }, {
        label: 'State',
        value: row => (row.state || '')
      }, {
        label: 'Zipcode',
        value: row => (row.zipcode | '')
      }, {
        label: 'Payment method',
        value: (row) => {
          if (row.paymentMethod === 'cod') {
            return 'COD';
          }

          if (row.paymentMethod === 'paypal') {
            return 'Paypal';
          }

          if (row.paymentMethod === 'stripe') {
            return 'CC';
          }

          return 'N/A';
        }
      }, {
        label: 'Commission rate',
        value: row => (row.commissionRate || 0)
      }, {
        label: 'Commission',
        value: row => (row.commission || 0)
      }, {
        label: 'Balance',
        value: row => (row.balance || 0)
      }, {
        label: 'User IP',
        value: row => (row.userIP || '')
      }, {
        label: 'Date',
        value: row => moment(row.createdAt).format('DD/MM/YYYY HH:mm')
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
