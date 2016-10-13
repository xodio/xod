const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpackTargetElectronRenderer = require('webpack-target-electron-renderer');

const pkgpath = subpath => path.resolve(__dirname, '..', subpath);
const assetsPath = fs.realpathSync(pkgpath('node_modules/xod-client/src/core/assets'));

const options = {
  devtool: 'source-map',
  entry: [
    'babel-polyfill',
    pkgpath('src/view/index.jsx'),
    pkgpath('node_modules/xod-client/src/core/styles/main.scss'),
    pkgpath('src/view/styles/main.scss'),
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
    contentBase: pkgpath('dist'),
  },
  resolve: {
    modulesDirectories: [
      pkgpath('node_modules'),
      pkgpath('node_modules/xod-client/node_modules'),
      pkgpath('node_modules/xod-client/node_modules/xod-core/node_modules'),
      pkgpath('node_modules/xod-espruino/node_modules'),
    ],
    extensions: ['', '.js', '.jsx', '.scss'],
    alias: {
      // @TODO: Get rid of this hack:
      // encoding: pkgpath('node_modules/react'),
      // 'iconv-lite': pkgpath('node_modules/react'),
    },
  },
  module: {
    loaders: [
      {
        test: /src\/.*\.jsx?$/,
        exclude: /node_modules/,
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
          `file?name=assets/[path][name].[ext]?[hash:6]&context=${assetsPath}`,
        ],
      },
      {
        test: /node_modules\/font-awesome\/.*\.(jpe?g|png|gif|svg|ttf|eot|svg|woff|woff2)(\?\S*)?$/,
        loaders: [
          'file?name=assets/font-awesome/[name].[ext]?[hash:6]',
        ],
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.json5$/,
        loader: 'json5-loader',
      },
      {
        test: /json5\/lib\/require/,
        loader: 'null',
      },
    ],
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new CopyWebpackPlugin([
      { from: pkgpath('src/view/index.html') },
    ]),
  ],
};

options.target = webpackTargetElectronRenderer(options);

module.exports = options;
