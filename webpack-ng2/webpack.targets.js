var CONSTANTS = require('./webpack.constants');

module.exports = function getTarget(compilationMode) {
  switch (compilationMode) {
    case CONSTANTS.MODE.DEVELOPMENT,NANE:
      return require('./modes/development/development');
    case CONSTANTS.MODE.PRODUCTION.NAME:
      return require('./modes/production/production');
    case CONSTANTS.MODE.TEST.NAME:
      return require('./modes/test/test');
  }
};
