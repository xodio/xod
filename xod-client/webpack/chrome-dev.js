
const path = require('path');
const validate = require('webpack-validator');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const baseConfig = require('./base.js');

const config = merge.smart(baseConfig, {
  output: {
    path: path.join(__dirname, '../dist/chrome'),
  },
  entry: [
    './src/runtime/xod-espruino/upload.js',
  ],
  module: {
    loaders: [
      {
        test: /src\/runtime\/.*\.js$/,
        exclude: [
          /src\/runtime\/.*runtime\.js$/,
        ],
        loader: 'babel?presets[]=es2015',
      },
      {
        test: /node_modules\/espruino\/espruino\.js$/,
        loaders: [
          'exports?Espruino',
          'imports?$=jquery',
        ],
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
      { from: 'src/client/chrome/' },
    ]),
  ],
});

module.exports = validate(config);
