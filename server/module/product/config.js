const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const csvDir = 'public/files/csv';
const csvFilePath = path.resolve(csvDir);

if (!fs.existsSync(csvFilePath)) {
  mkdirp.sync(csvFilePath);
}

module.exports = {
  csvDir
};
