const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const libraryName = 'xod-js';

const pkgpath = subpath => path.join(__dirname, '..', subpath);

module.exports = {
  entry: path.join(__dirname, '../src/index.js'),
  output: {
    path: path.join(__dirname, '../dist'),
    libraryTarget: 'umd',
    library: libraryName,
    filename: 'index.js',
    umdNamedDefine: true
  },
  externals: [
    'xod-core',
    'fs',
  ],
  resolve: {
    modulesDirectories: [
      'node_modules',
      pkgpath('node_modules'),
      pkgpath('node_modules/xod-core/node_modules'),
    ],
    extensions: ['', '.js'],
  },
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
