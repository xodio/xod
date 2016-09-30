
const validate = require('webpack-validator');
const merge = require('webpack-merge');

const baseConfig = require('./base.js');

const config = merge.smart(baseConfig, {
  module: {
    loaders: [
      {
        test: /.*\.spec\.js$/,
        loaders: [
          'babel',
        ],
      },
      {
        test: /src\/runtime\.js$/,
        loader: 'babel',
      },
      {
        test: /node_modules\/espruino\/.*\.js$/,
        loader: 'null',
      },
    ],
  },
});

module.exports = validate(config);
