
const path = require('path');
const webpack = require('webpack');
const validate = require('webpack-validator');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const baseConfig = require('./base.js');

const config = merge.smart(baseConfig, {
  output: {
    path: path.join(__dirname, '../dist/web'),
    publicPath: 'http://localhost:8080/',
  },
  module: {
    loaders: [
      {
        test: /src\/client\/.*\.jsx?$/,
        loaders: ['react-hot'],
      },
      {
        test: /runtime\/.*\.js$/,
        loader: 'null',
      },
    ],
  },
  devServer: {
    hot: true,
    host: 'localhost',
    port: 8080,
    contentBase: './dist/web/',
  },
});

module.exports = validate(config);
