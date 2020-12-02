/* eslint import/no-dynamic-require: 0 */

const args = process.argv.slice(2);
const path = require('path');


console.log('hry')
if (args.length && args[0] === 'test') {
  console.log('Test');
  process.exit();
} if (args.length && args[0]) {
  setTimeout(async () => {
    console.log('Migrate data');
    await require(path.join(__dirname, args[0]))();

    console.log('migrate data done...');
    process.exit();
  });
} else {
  console.log('hi')
  setTimeout(async () => {
    console.log('Migrate config');
    await require('./config')();

    console.log('Migrate user');
    await require('./user')();

    console.log('Migrate i18n');
    await require('./i18n')();

    console.log('Migrate country');
    await require('./country')();

    console.log('Migrate pages');
    await require('./pages')();

    console.log('Migrate Product Transaction type');
    await require('./producttransactiontypes')();

    console.log('Migrate Product type');
    await require('./producttypes')();


    console.log('migrate data done...');
    process.exit();
  });
}
