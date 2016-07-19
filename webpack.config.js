const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  devtool: 'inline-source-map',
  entry: [
    'webpack-dev-server/client?http://localhost:8080/',
    'webpack/hot/only-dev-server',
    './app/index.jsx',
  ],
  output: {
    path: path.join(__dirname, 'dist/web'),
    filename: 'bundle.js',
    publicPath: 'http://localhost:8080/',
  },
  resolve: {
    modulesDirectories: ['node_modules', 'app'],
    extensions: ['', '.js', '.jsx', '.scss'],
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: [
          /node_modules/,
          /targets\/espruino\/runtime\.js/
        ],
        loaders: [
          'react-hot',
          'babel?presets[]=react,presets[]=es2015',
        ],
      },
      {
        test: /\.scss$/,
        loaders: [
          'style',
          'css',
          'autoprefixer?browsers=last 3 versions',
          'sass?outputStyle=expanded',
        ],
      },
      {
        test: /assets\/.*\.(jpe?g|png|gif|svg|woff|woff2)$/,
        loaders: [
          'file?name=[path][name].[ext]?[hash:6]&context=./app'
        ],
      },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new CopyWebpackPlugin([
      { from: 'app/index.html' },
    ]),
  ],
  devServer: {
    hot: true,
    host: 'localhost',
    port: 8080,
    contentBase: './dist/web/',
  },
};
