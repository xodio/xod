/**
 * Basic Webpack Config that could be extended with additional
 * configurations for specific platform (browser / electron).
 *
 * Because of Webpack config should contain some absolute paths (like `dist`),
 * it's a function that accepts one argument: absolute path to specific platform
 * root (`__dirname` in theirs webpack.config.js).
 *
 * Usage:
 * ```
 * const merge = require('webpack-merge');
 * const getBaseConfig = require('xod-client/webpack.config');
 *
 * merge.smart(getBaseConfig(__dirname), {
 *   entry: [
 *     path.resolve(__dirname, 'src/styles/specificStyles.scss'),
 *   ],
 * });
 * ```
 */

const fs = require('fs');
const path = require('path');
/* eslint-disable import/no-extraneous-dependencies */
const findup = require('findup-sync');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
/* eslint-enable import/no-extraneous-dependencies */

const pkgpath = (pkgDir, subpath) => path.join(pkgDir, subpath);
const assetsPath = fs.realpathSync(findup('node_modules/xod-client/src/core/assets'));
const fontAwesomePath = fs.realpathSync(findup('node_modules/font-awesome'));

const IS_DEV = (
  !process.env.NODE_ENV ||
  process.env.NODE_ENV === 'development'
);

module.exports = pkgDir => ({
  devtool: 'source-map',
  entry: [
    'babel-polyfill',
    findup('node_modules/xod-client/src/core/styles/main.scss'),
    pkgpath(pkgDir, 'src/shim.js'),
    pkgpath(pkgDir, 'src/index.jsx'),
  ],
  output: {
    filename: 'bundle.js',
    path: pkgpath(pkgDir, 'dist'),
    publicPath: '',
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx'],
    alias: {
      handlebars: 'handlebars/dist/handlebars.js',
      /** @see {@link http://stackoverflow.com/a/32444088} */
      react: findup('node_modules/react'),
    },
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
      {
        include: pkgpath(pkgDir, 'src'),
        test: /\.jsx?$/,
        loader: 'babel-loader',
        options: {
          presets: ['react', 'es2015'],
          plugins: ['transform-object-rest-spread'],
        },
      },
      {
        test: /\.worker\.js$/,
        loader: 'worker-loader',
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
              plugins: [autoprefixer()],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              outputStyle: 'expanded',
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
              plugins: [autoprefixer()],
            },
          },
        ],
      },
      {
        include: assetsPath,
        test: /\.(jpe?g|png|gif|svg|ttf|eot|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'assets/[path][name].[ext]?[hash:6]',
          context: assetsPath,
        },
      },
      {
        include: fontAwesomePath,
        test: /\.(jpe?g|png|gif|svg|ttf|eot|woff|woff2)(\?\S*)?$/,
        loader: 'file-loader',
        options: {
          name: 'assets/font-awesome/[name].[ext]?[hash:6]',
        },
      },
    ],
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new CopyWebpackPlugin([
      { from: findup('node_modules/xod-client/src/core/assets/index.html') },
    ]),
  ].concat(
    IS_DEV ? [] : [
      new UglifyJSPlugin({
        sourceMap: true,
        parallel: true,
        uglifyOptions: {
          mangle: false,
          toplevel: true,
          output: {
            webkit: true,
          },
        },
      }),
    ]
  ),
});
