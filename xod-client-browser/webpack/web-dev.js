
const path = require('path');
const webpack = require('webpack');
const validate = require('webpack-validator');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const baseConfig = require('./base.js');

const config = merge.smart(baseConfig, {
  output: {
    publicPath: 'http://localhost:8080/',
  },
  module: {
    loaders: [
      {
        test: /src\/.*\.jsx?$/,
        loaders: ['react-hot'],
      },
    ]
  }
});

module.exports = validate(config);
