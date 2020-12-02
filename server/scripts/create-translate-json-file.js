/* eslint import/no-extraneous-dependencies: 0, no-restricted-syntax: 0, no-await-in-loop: 0 */
const translate = require('yandex-translate')(process.env.YANDEX_API_KEY);
const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '..', 'migrations', 'translation', 'en.json');

const args = process.argv.slice(2);
const lang = args[1];
if (!lang) {
  console.log('No translation target lang');
  process.exit();
} else if (lang === 'en') {
  console.log('EN is blocked file');
  process.exit();
}

const targetFile = path.join(__dirname, '..', 'migrations', 'translation', `${lang}.json`);
if (!fs.existsSync(targetFile)) {
  fs.writeFileSync(targetFile, '{}');
}
module.exports = async () => {
  try {
    const sourceData = fs.readFileSync(sourceFile, { encoding: 'utf-8' });
    const jsonData = JSON.parse(sourceData);
    const keys = Object.keys(jsonData);
    const targetData = fs.readFileSync(targetFile, { encoding: 'utf-8' });
    const targetJson = JSON.parse(targetData);
    for (const key of keys) {
      if (!targetJson[key]) {
        const text = await new Promise(resolve => translate.translate(key, { to: lang }, (err, res) => {
          const translatedText = err ? '' : res.text[0];
          resolve(translatedText);
        }));

        targetJson[key] = text;
        // write file on this time, it is not really good but we will not loss data
        fs.writeFileSync(targetFile, JSON.stringify(targetJson, null, 4));
        console.log(key, ':', text);
      }
    }
  } catch (e) {
    console.log(e);
    process.exit();
  }
};
