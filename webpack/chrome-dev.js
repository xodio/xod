
const path = require('path');
const webpack = require('webpack');
const validate = require('webpack-validator');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const baseConfig = require('./base.js');

const config = merge.smart(baseConfig, {
  output: {
    path: path.join(__dirname, '../dist/chrome'),
  },
  entry: [
    './targets/xod-espruino/upload.js'
  ],
  module: {
    loaders: [
      {
        test: /targets\/.*\.js$/,
        exclude: [
          /targets\/.*runtime\.js$/,
        ],
        loader: 'babel?presets[]=es2015',
      },
      {
        test: /node_modules\/espruino\/espruino\.js$/,
        loaders: [
          'exports?Espruino',
          'imports?$=jquery',
        ]
      },
      {
        test: /node_modules\/espruino\/.*\.js$/,
        loader: 'imports?Espruino=espruino/espruino&$=jquery',
      },
    ],
  },
  externals: {
    fs: true,
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'app/chrome/' },
    ]),
  ],
});

module.exports = validate(config);
