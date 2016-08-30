const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: [
    './src/index.js',
  ],
  output: {
    path: path.join(__dirname, '../dist'),
    filename: 'index.js',
  },
  resolve: {
    root: path.join(__dirname, '../src'),
    modulesDirectories: ['node_modules', 'src'],
    extensions: ['', '.js'],
  },
  module: {
    loaders: [
      {
        test: /node_modules\/espruino\/.*\.js$/,
        loader: 'null',
      },
      {
        test: /src\/.*\.js$/,
        exclude: [
          /src\/runtime\.js$/,
        ],
        loader: 'babel?presets[]=es2015',
      },
      {
        test: /node_modules\/espruino\/espruino\.js$/,
        loaders: [
          'exports?Espruino',
          'imports?$=jquery',
        ],
      },
      {
        test: /node_modules\/espruino\/.*\.js$/,
        loader: 'imports?Espruino=espruino/espruino&$=jquery',
      },
    ],
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
  ],
};
