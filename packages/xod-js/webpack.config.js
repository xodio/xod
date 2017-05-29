const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const libraryName = 'xod-js';

const pkgpath = subpath => path.join(__dirname, subpath);

module.exports = {
  devtool: 'source-map',
  entry: pkgpath('src/index.js'),
  output: {
    path: pkgpath('dist'),
    libraryTarget: 'umd',
    library: libraryName,
    filename: 'index.js',
    umdNamedDefine: true,
  },
  externals: [
    'fs',
  ],
  module: {
    loaders: [
      {
        include: pkgpath('src'),
        test: /\.js$/,
        loader: 'babel?presets[]=es2015',
      },
      {
        include: pkgpath('platform'),
        test: /\.js$/,
        loader: 'raw',
      },
    ],
  },
};
