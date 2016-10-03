
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
    ],
  },
  externals: {
    fs: true,
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'src/chrome/' },
    ]),
  ],
});

module.exports = validate(config);
