var getTarget = require('./webpack-ng2/webpack.targets');
var CONSTANTS = require('./webpack-ng2/webpack.constants');

console.log(JSON.stringify((getTarget(CONSTANTS.MODE.DEVELOPMENT.NAME))));

module.exports = getTarget(CONSTANTS.MODE.DEVELOPMENT.NAME);
