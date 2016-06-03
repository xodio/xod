var nodeExternals = require('webpack-node-externals');
var path = require('path');
var webpackMerge = require('webpack-merge');
var sharedConfig = require('../../shared/shared');
var target = require('./development.paths').targets.development;
var sources = require('../../shared/shared.paths').sources;
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = webpackMerge(sharedConfig, {
  entry: {
    client: path.resolve('./angularjs/application/client.js')
  },
  resolve: {
    extensions: ['', '.js', 'css', 'json'],
    root: path.resolve(sources, '..')
  },
  loaders: [{
    test: /\.js$/,
    loader: 'babel',
    exclude: /node_modules/
  }],
  preLoaders: [{
    test: /\.js$/,
    loader: 'source-map-loader',
    exclude: /node_modules/
  }],
  output: {
    path: target,
    filename: '[name].bundle.js',
    sourceMapFilename: '[name].map'
  },
  target: 'node',
  externals: [nodeExternals()],
  plugins: [new CopyWebpackPlugin([{
    from: path.resolve(sources, 'application') + 'index.html',
    to: path.resolve(target)
  }])]
});

