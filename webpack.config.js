/* global __dirname */

var path = require('path');
var webpack = require('webpack');

var dirJS = path.resolve(__dirname, 'static');
var dirBuild = path.resolve(__dirname, 'build/web');

module.exports = {
  entry: path.resolve(dirJS, 'graph.js'),
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
