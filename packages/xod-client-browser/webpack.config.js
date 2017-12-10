const fs = require('fs');
const path = require('path');
const findup = require('findup-sync');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');

const pkgpath = subpath => path.join(__dirname, subpath);
const assetsPath = fs.realpathSync(findup('node_modules/xod-client/src/core/assets'));
const fontAwesomePath = fs.realpathSync(findup('node_modules/font-awesome'));

module.exports = {
  devtool: 'source-map',
  entry: [
    'babel-polyfill',
    findup('node_modules/xod-client/src/core/styles/main.scss'),
    pkgpath('src/shim.js'),
    pkgpath('src/index.jsx'),
  ],
  output: {
    filename: 'bundle.js',
    path: pkgpath('dist'),
    publicPath: '',
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js', '.json', '.jsx'],
    alias: {
      handlebars: 'handlebars/dist/handlebars.js',
      /** @see {@link http://stackoverflow.com/a/32444088} */
      react: findup('node_modules/react'),
    },
  },
  module: {
    preLoaders: [
      { test: /\.js$/, loader: 'source-map-loader' },
    ],
    loaders: [
      {
        include: pkgpath('src'),
        test: /\.jsx?$/,
        loaders: [
          'babel',
        ],
      },
      {
        test: /\.scss$/,
        loaders: [
          'style',
          'css',
          'postcss',
          'sass?outputStyle=expanded',
        ],
      },
      {
        test: /\.css$/,
        loaders: [
          'style',
          'css',
        ],
      },
      {
        include: assetsPath,
        test: /\.(jpe?g|png|gif|svg|ttf|eot|woff|woff2)$/,
        loaders: [
          `file?name=assets/[path][name].[ext]?[hash:6]&context=${assetsPath}`,
        ],
      },
      {
        include: fontAwesomePath,
        test: /\.(jpe?g|png|gif|svg|ttf|eot|woff|woff2)(\?\S*)?$/,
        loaders: [
          'file?name=assets/font-awesome/[name].[ext]?[hash:6]',
        ],
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
    ],
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new CopyWebpackPlugin([
      { from: findup('node_modules/xod-client/src/core/assets/index.html') },
    ]),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.XOD_HM_DEF': JSON.stringify(process.env.XOD_HM_DEF || false),
      'process.env.WHY_DID_YOU_UPDATE': JSON.stringify(process.env.WHY_DID_YOU_UPDATE || false),

      'process.env.XOD_HOSTNAME': JSON.stringify(process.env.XOD_HOSTNAME || 'xod.io'),
      'process.env.XOD_SITE_DOMAIN': JSON.stringify(''),
      'process.env.XOD_FORUM_DOMAIN': JSON.stringify('https://forum.xod.io/'),
      'process.env.XOD_UTM_SOURCE': JSON.stringify('ide-browser'),
    }),
  ],
  postcss: function postCssPlugins() { return [autoprefixer]; },
};
