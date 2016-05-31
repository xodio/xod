var CONSTANTS = require('./webpack.constants');

module.exports = function getTarget(compilationMode) {
    switch (compilationMode) {
        case CONSTANTS.MODE.DEVELOPMENT:
            return require('./targets/development/development');
        case CONSTANTS.MODE.PRODUCTION:
            return require('./targets/production/production');
        case CONSTANTS.MODE.TEST:
            return require('./targets/test/test');
    }
};