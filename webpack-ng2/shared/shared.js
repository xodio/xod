var _ = require('lodash');
var paths = require('./shared.paths');
var loaders = require('./shared.loaders');
var plugins = require('./shared.plugins');

module.exports = _.merge([{
    loaders: loaders
}, plugins]);
