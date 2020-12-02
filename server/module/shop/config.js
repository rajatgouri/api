const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const documentDir = 'public/documents/';
const fullDocumentPath = path.resolve(documentDir);

if (!fs.existsSync(fullDocumentPath)) {
  mkdirp.sync(fullDocumentPath);
}

module.exports = {
  documentDir
};
