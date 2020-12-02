const path = require('path');
const nconf = require('nconf');
const pdf = require('html-pdf');

const swig = require('../../../kernel/services/template-engine').getSwigEngine();

const viewsPath = path.join(__dirname, '..', '..', '..', 'html-content');

exports.createFromHtml = async (html, toFile) => {
  try {
    return new Promise((resolve, reject) => {
      pdf.create(html).toFile(toFile, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve({
          fileName: res.filename
        });
      });
    });
  } catch (e) {
    throw e;
  }
};

exports.toStream = async (html) => {
  try {
    return new Promise((resolve, reject) => {
      pdf.create(html).toStream((err, stream) => {
        if (err) {
          return reject(err);
        }

        return resolve(stream);
      });
    });
  } catch (e) {
    throw e;
  }
};

exports.toStreamFromTemplate = async (template, options) => {
  try {
    const newOptions = Object.assign(options, {
      appConfig: {
        baseUrl: nconf.get('baseUrl'),
        logoUrl: nconf.get('logoUrl'),
        siteName: nconf.get('SITE_NAME'),
        facebookUrl: nconf.get('facebookUrl'),
        twitterUrl: nconf.get('twitterUrl')
      }
    });
    const html = swig.renderFile(path.join(viewsPath, template), newOptions);
    return new Promise((resolve, reject) => {
      pdf.create(html).toStream((err, stream) => {
        if (err) {
          return reject(err);
        }

        return resolve(stream);
      });
    });
  } catch (e) {
    throw e;
  }
};
