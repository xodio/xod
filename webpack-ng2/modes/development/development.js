var nodeExternals = require('webpack-node-externals');
var path = require('path');
var webpackMerge = require('webpack-merge');
var sharedConfig = require('../../shared/shared');
var target = require('./development.paths').targets.development;
var sources = require('../../shared/shared.paths').sources;
var CopyWebpackPlugin = require('copy-webpack-plugin');
var webpack = require('webpack');
var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');

module.exports = webpackMerge(sharedConfig, {
  entry: {
    client: ['babel-polyfill', path.resolve('./client/client.ts')]
  },
  resolve: {
    extensions: ['', '.js', 'css', 'json'],
    root: path.resolve(sources, '..')
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      query: {
        presets: ['es2015', 'angular2'],
        plugins: ['transform-runtime']
      },
      exclude: /node_modules/
    }, {
      test: /\.ts/,
      loader: 'ts-loader',
      exclude: /node_modules/
    }]
  },
  output: {
    path: target,
    filename: '[name].bundle.js',
    sourceMapFilename: '[name].map'
  },
  target: 'web',
  plugins: [
    new CopyWebpackPlugin([{
      from: path.resolve(sources) + '/index.html',
      to: path.resolve(target)
    }, {
      from: path.resolve(sources, '..', 'node_modules', 'babel-polyfill', 'dist') + '/polyfill.js',
      to: path.resolve(target)
    }]),
    commonsPlugin
  ],
  devServer: {
    colors: true,
    contentBase: './dists/development',
    historyApiFallback: true,
    inline: true,
    progress: true
  },

  devtool: 'eval-source-map'
});

console.log(module.exports);
