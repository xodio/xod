const path = require('path');
const validate = require('webpack-validator');
const merge = require('webpack-merge');

const baseConfig = require('./webpack.config.js');
const pkgpath = subpath => path.join(__dirname, subpath);

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
});

module.exports = validate(config);
