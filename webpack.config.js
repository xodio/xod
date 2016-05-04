/* global __dirname */

var path = require('path');
var webpack = require('webpack');

var dirJS = path.resolve(__dirname, 'js');
var dirBuild = path.resolve(__dirname, 'build/web');

module.exports = {
  entry: [
    path.resolve(dirJS, 'main.js'),
    'bootstrap-loader'
  ],
  output: {
    path: dirBuild,
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: dirJS, loader: 'babel-loader' },
      { test: /\.css$/, loaders: [ 'style', 'css', 'postcss' ] },
      { test: /\.scss$/, loaders: [ 'style', 'css', 'postcss', 'sass' ] },
      { test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url?limit=10000" },
      { test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/, loader: 'file' },
      { test: /bootstrap-sass\/assets\/javascripts\//, loader: 'imports?jQuery=jquery' },
    ]
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
