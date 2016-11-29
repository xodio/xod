
const path = require('path');
const validate = require('webpack-validator');
const merge = require('webpack-merge');

const baseConfig = require('./base.js');
const pkgpath = subpath => path.join(__dirname, '..', subpath);

const config = merge.smart(baseConfig, {
  output: {
    publicPath: 'http://localhost:8080/',
  },
  devServer: {
    hot: true,
    host: 'localhost',
    port: 8080,
    contentBase: pkgpath('dist'),
  },
  resolve: {
    modulesDirectories: [
      // search top-level node_modules for webpack-hot-loader
      pkgpath('../../node_modules'), 
    ],
    extensions: ['', '.js', '.jsx', '.scss'],
  },
  module: {
    loaders: [
      {
        include: pkgpath('src'),
        test: /\.jsx?$/,
        loaders: ['react-hot'],
      },
    ]
  }
});

module.exports = validate(config);
