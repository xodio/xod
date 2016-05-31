var getTarget = require('./webpack-ng2/webpack.targets');
var CONSTANTS = require('./webpack-ng2/webpack.constants');

module.exports = getTarget(CONSTANTS.MODE.DEVELOPMENT);
