var CONSTANTS = require('./webpack.constants');

module.exports = function getTarget(compilationMode) {
  switch (compilationMode) {
    case CONSTANTS.MODE.DEVELOPMENT:
      return require('./modes/development/development');
    case CONSTANTS.MODE.PRODUCTION:
      return require('./modes/production/production');
    case CONSTANTS.MODE.TEST:
      return require('./modes/test/test');
  }
};
