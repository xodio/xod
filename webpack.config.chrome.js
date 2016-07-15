const path = require('path');
const config = require('./webpack.config.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');

config.output.path = path.join(__dirname, 'dist/chrome');

// Remove hot reloading plugin to prevent storing temporary files *.hot-upload.*
config.plugins.shift();
// Add copy plugin, that copy all files from app/chrome directory
config.plugins.push(new CopyWebpackPlugin([
  { from: 'app/chrome/' },
]));

module.exports = config;
