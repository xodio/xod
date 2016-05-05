/* global __dirname */

var path = require('path');
var webpack = require('webpack');

var dirJS = path.resolve(__dirname, 'js');
var dirTargets = path.resolve(__dirname, 'targets');
var dirStyle = path.resolve(__dirname, 'static');
var dirBuild = path.resolve(__dirname, 'build/web');

module.exports = {
  entry: [
    path.resolve(dirJS, 'main.js'),
    path.resolve(dirTargets, 'espruino/patch-transpiler.js'),
    path.resolve(dirStyle, 'patch.scss'),
    path.resolve(dirStyle, 'ui.scss'),
    'bootstrap-loader',
  ],
  output: {
    path: dirBuild,
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: dirJS, loader: 'babel-loader' },
      { test: dirTargets, loader: 'babel-loader' },
      { test: require.resolve("jquery"), loader: "expose?$!expose?jQuery" },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.css$/, loaders: [ 'style', 'css', ] },
      { test: /\.scss$/, loaders: [ 'style', 'css', 'sass' ] },
      { test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url?limit=10000" },
      { test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/, loader: 'file' },
      { test: /bootstrap-sass\/assets\/javascripts\//, loader: 'imports?jQuery=jquery' },
    ]
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
  ],
  stats: {
    colors: true
  },
  // Create Sourcemaps for the bundle
  devtool: 'source-map',
};
