const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const pkgpath = subpath => path.join(__dirname, '..', subpath);

module.exports = {
  devtool: 'source-map',
  entry: [
    'babel-polyfill',
    pkgpath('src/shim.js'),
    pkgpath('src/index.jsx'),
    pkgpath('node_modules/xod-client/src/core/styles/main.scss'),
  ],
  output: {
    filename: 'bundle.js',
    path: pkgpath('dist'),
    publicPath: '',
  },
  resolve: {
    modulesDirectories: [
      pkgpath('node_modules'),
      pkgpath('node_modules/xod-client/node_modules'),
      pkgpath('node_modules/xod-client/node_modules/xod-core/node_modules'),
    ],
    extensions: ['', '.js', '.jsx', '.scss'],
  },
  module: {
    loaders: [
      {
        test: /src\/.*\.jsx?$/,
        loaders: [
          'babel?presets[]=react,presets[]=es2015',
        ],
      },
      {
        test: /\.scss$/,
        loaders: [
          'style',
          'css',
          'sass?outputStyle=expanded',
        ],
      },
      {
        test: /assets\/.*\.(jpe?g|png|gif|svg|ttf|eot|svg|woff|woff2)?$/,
        loaders: [
          'file?name=assets/[path][name].[ext]?[hash:6]&context=../xod-client/src/core/assets',
        ],
      },
      {
        test: /node_modules\/font-awesome\/.*\.(jpe?g|png|gif|svg|ttf|eot|svg|woff|woff2)(\?\S*)?$/,
        loaders: [
          'file?name=assets/font-awesome/[name].[ext]?[hash:6]',
        ],
      },
      {
        test: /\.json5$/,
        loader: 'json5-loader',
      },
      {
        test: /json5\/lib\/require/,
        loader: 'null',
      }
    ],
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new CopyWebpackPlugin([
      { from: pkgpath('src/index.html') },
    ]),
  ],
};
