const path = require('path');
const config = require('./webpack.config.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');

config.output.path = path.join(__dirname, 'dist/chrome');

config.plugins.push(new CopyWebpackPlugin([
  { from: 'app/chrome/' },
]));

module.exports = config;
