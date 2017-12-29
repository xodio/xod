const path = require('path');
/* eslint-disable import/no-extraneous-dependencies */
const merge = require('webpack-merge');
/* eslint-enable import/no-extraneous-dependencies */
const baseConfig = require('./webpack.config.js');

const pkgpath = subpath => path.join(__dirname, subpath);

module.exports = merge.smart(baseConfig, {
  devtool: 'eval-source-map',
  output: {
    publicPath: 'http://localhost:8080/',
  },
  devServer: {
    hot: true,
    host: 'localhost',
    port: 8080,
    contentBase: pkgpath('dist'),
    compress: true,
  },
});
