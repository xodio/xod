const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const libraryName = 'xod-espruino';

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
    /xod-core\/.*/,
    {fs: true},
  ],
  resolve: {
    root: path.join(__dirname, '../src'),
    modulesDirectories: ['node_modules', 'src', 'src/node_modules'],
    extensions: ['', '.js'],
  },
  module: {
    loaders: [
      {
        test: /src\/.*\.js$/,
        exclude: [
          /src\/runtime\.js$/,
        ],
        loader: 'babel',
      },
      {
        test: /src\/runtime\.js$/,
        loader: 'raw',
      },
      {
        test: /node_modules\/espruino\/espruino\.js$/,
        loaders: [
          'globals?./src/shame.js',
          'exports?Espruino',
          'imports?$=jquery',
        ],
      },
      {
        test: /node_modules\/espruino\/.+\.js$/,
        loaders: [
          'globals?./src/shame.js',
          'imports?Espruino=espruino/espruino,$=jquery',
        ],
      },
    ],
  },
};
