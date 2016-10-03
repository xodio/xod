const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const pkgpath = subpath => path.join(__dirname, '..', subpath);

module.exports = {
  devtool: 'source-map',
  entry: [
    'babel-polyfill',
    pkgpath('src/index.jsx'),
    pkgpath('../xod-client/src/core/styles/main.scss'),
  ],
  output: {
    filename: 'bundle.js',
    path: pkgpath('dist'),
    publicPath: '',
  },
  devServer: {
    hot: true,
    host: 'localhost',
    port: 8080,
    contentBase: './dist/',
  },
  resolve: {
    root: pkgpath('src'),
    modulesDirectories: [
      pkgpath('node_modules'),
      pkgpath('src'),
      pkgpath('src/node_modules'),
      pkgpath('../xod-client/node_modules'),
      pkgpath('../xod-core/node_modules'),
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
          'file?name=[path][name].[ext]?[hash:6]&context=./src',
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
        test: /src\/node_modules\/xod-espruino\/index\.js$/,
        loader: 'null',
      },
    ],
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new CopyWebpackPlugin([
      { from: pkgpath('src/index.html') },
    ]),
  ],
};
