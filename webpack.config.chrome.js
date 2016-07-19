const path = require('path');
const config = require('./webpack.config.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');

config.output.path = path.join(__dirname, 'dist/chrome');

// Add Espruino upload & serial communication functionality
config.entry.push('./targets/espruino/upload.js');

// Remove hot reloading plugin to prevent storing temporary files *.hot-upload.*
config.plugins.shift();
// Add copy plugin, that copy all files from app/chrome directory
config.plugins.push(new CopyWebpackPlugin([
  { from: 'app/chrome/' },
]));

// Do not resolve chrome-native JS-modules
config.externals = Object.assign(config.externals || {}, {
  fs: true,
});

config.module.loaders = [
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
  ...config.module.loaders
];

config.entry = ['./app/index.jsx'];

module.exports = config;
