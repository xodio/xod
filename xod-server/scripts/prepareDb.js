const R = require('ramda');
const server = require('../server/server.js');
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

// Create a user
const createUser = (app) =>
  new Promise(resolve => {
    const User = app.models.user;

    User.create(
      userOptions,
      (err, instance) => {
        if (err) { console.error(err); }
        console.log(`+ Add user ${instance.username}:${userOptions.password}: successfully.`);
        resolve(app);
      });
  });

// Run
Promise.resolve(server)
  .then(destroyAll)
  .then(emptyLine)
  .then(createUser)
  .then(emptyLine)
  .then(() => {
    console.log('=== It\'s done! ===');
    process.exit();
  });
