const R = require('ramda');
const server = require('../server/server.js');
const createUser = require('./parts/create-user.js');
/* eslint-disable max-len */

const userOptions = {
  email: 'test@amperka.ru',
  username: 'Amperka',
  password: 'qwe123',
};

// Utils
const emptyLine = (data) => { console.log(''); return data; };

// Destroy all datas!
const destroyAll = (app) =>
  new Promise(resolve => {
    const models = R.pipe(
      R.prop('models'),
      R.toPairs,
      R.reject(([modelName]) => modelName === 'AccessToken')
    )(app);
    let curCount = 0;

    R.forEach(
      ([modelName, model]) => model.destroyAll(
        (err, info) => {
          if (err) { console.error(err); }
          console.log(`- Clear model '${modelName}': removed ${info.count} records.`);

          curCount++;
          if (curCount === models.length) { resolve(app); }
        }
      )
    )(models);
  });

// Run
Promise.resolve(server)
  .then(destroyAll)
  .then(emptyLine)
  .then(createUser(userOptions))
  .then(emptyLine)
  .then(() => {
    console.log('=== It\'s done! ===');
    process.exit();
  });
