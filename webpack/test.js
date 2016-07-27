
const validate = require('webpack-validator');
const merge = require('webpack-merge');

const baseConfig = require('./base.js');

const config = merge.smart(baseConfig, {
  module: {
    loaders: [
      {
        test: /test\/.*\.js$/,
        loaders: [
          'babel?presets[]=es2015',
        ],
      },
      {
        test: /targets\/.*\.js$/,
        loader: 'babel?presets[]=es2015',
      },
    ],
  },
});

module.exports = validate(config);
