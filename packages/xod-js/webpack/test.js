
const validate = require('webpack-validator');
const merge = require('webpack-merge');

const baseConfig = require('./base.js');

delete baseConfig['externals'];

const config = merge.smart(baseConfig, {
  module: {
    loaders: [
      {
        test: /.*\.spec\.js$/,
        loaders: [
          'babel?presets[]=es2015',
        ],
      },
      {
        test: /platform\/.*\.js$/,
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
