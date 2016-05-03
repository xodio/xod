/* global __dirname */

var path = require('path');
var webpack = require('webpack');

var dirJS = path.resolve(__dirname, 'js');
var dirBuild = path.resolve(__dirname, 'build/web');

module.exports = {
  entry: path.resolve(dirJS, 'main.js'),
  output: {
    path: dirBuild,
    filename: 'bundle.js'
  },
  module: {
    loaders: [{
      loader: 'babel-loader',
      test: dirJS,
    }]
  },
  plugins: [
    new webpack.NoErrorsPlugin()
  ],
  stats: {
    colors: true
  },
  // Create Sourcemaps for the bundle
  devtool: 'source-map',
};
