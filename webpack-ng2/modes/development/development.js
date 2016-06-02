var nodeExternals = require('webpack-node-externals');
var path = require('path');
var webpackMerge = require('webpack-merge');
var sharedConfig = require('../../shared/shared');
var target = require('./development.paths').targets.development;
var sources = require('../../shared/shared.paths').sources;

module.exports = webpackMerge(sharedConfig, {
  entry: {
    client: path.join(sources, 'application', 'client.js')
  },
  resolve: {
    extensions: ['', '.js', 'css', 'json'],
    root: sources,
    exclude: ['node_modules']
  },
  loaders: [{
    test: /\.js$/,
    loader: 'babel',
    exclude: /node_modules/
  }],
  preLoaders: [{
    test: /\.js$/,
    loader: 'source-map-loader',
    exclude: [
      'node_modules'
    ]
  }],
  output: {
    path: target,
    filename: '[name].bundle.js',
    sourceMapFilename: '[name].map'
  },
  target: 'node',
  externals: [nodeExternals()]
});
