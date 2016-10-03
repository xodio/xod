const R = require('ramda');
const server = require('../server/server.js');
const createUser = require('./parts/create-user.js');

const options = R.slice(2, Infinity, process.argv);

if (options.length !== 3) {
  console.error("(!) You should pass three parameters: username, email and password!");
  console.error("For example: npm run addUser test test@amperka.ru qwe123");
  process.exit(1);
}

const userOptions = {
  username: options[0],
  email: options[1],
  password: options[2],
};

createUser(userOptions)(server)
  .then(() => { process.exit(); })
  .catch(err => { console.error(err); process.exit(1); })
