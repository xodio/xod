const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');
const webpackTargetElectronRenderer = require('webpack-target-electron-renderer');

const pkgpath = subpath => path.resolve(__dirname, subpath);
const assetsPath = fs.realpathSync(pkgpath('node_modules/xod-client/src/core/assets'));
const fontAwesomePath = fs.realpathSync(pkgpath('node_modules/xod-client/node_modules/font-awesome'));

const options = {
  devtool: 'source-map',
  entry: [
    'babel-polyfill',
    pkgpath('node_modules/xod-client/src/core/styles/main.scss'),
    pkgpath('src/view/styles/main.scss'),
    pkgpath('src/shim.js'),
    pkgpath('src/index.jsx'),
  ],
  output: {
    filename: 'bundle.js',
    path: pkgpath('src-babel'),
    publicPath: '',
  },
  devServer: {
    hot: true,
    host: 'localhost',
    port: 8080,
    contentBase: pkgpath('src-babel'),
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js', '.json', '.jsx'],
    alias: {
      handlebars: 'handlebars/dist/handlebars.js',
      /** @see {@link http://stackoverflow.com/a/32444088} */
      react: pkgpath('node_modules/xod-client/node_modules/react'),
    },
  },
  externals: {
    // Webpack can’t package native modules
    // keep them external
    bindings: 'commonjs bindings',
    serialport: 'commonjs serialport',
  },
  module: {
    loaders: [
      {
        include: pkgpath('src'),
        test: /\.jsx?$/,
        loaders: [
          'babel?presets[]=react,presets[]=es2015',
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
        test: /\.(jpe?g|png|gif|svg|ttf|eot|svg|woff|woff2)$/,
        loaders: [
          `file?name=assets/[path][name].[ext]?[hash:6]&context=${assetsPath}`,
        ],
      },
      {
        include: [fontAwesomePath, pkgpath('node_modules/font-awesome')],
        test: /\.(jpe?g|png|gif|svg|ttf|eot|svg|woff|woff2)(\?\S*)?$/,
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
        include: pkgpath('json5/lib/require'),
        test: /.?/,
        loader: 'null',
      },
    ],
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new CopyWebpackPlugin([
      { from: pkgpath('src/index.html') },
    ]),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
  ],
  postcss: function postCssPlugins() { return [autoprefixer]; },
};

options.target = webpackTargetElectronRenderer(options);

module.exports = options;
