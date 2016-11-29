
const path = require('path');
const validate = require('webpack-validator');
const merge = require('webpack-merge');

const baseConfig = require('./base.js');

delete baseConfig['externals'];

const pkgpath = subpath => path.join(__dirname, '..', subpath);

const config = merge.smart(baseConfig, {
  module: {
    loaders: [
      {
        test: /.*\.spec\.js$/,
        loaders: [
          'babel?presets[]=es2015',
        ],
      },
      {
        include: pkgpath('platform'),
        test: /\.js$/,
        loader: 'babel',
      }
    ],
  },
});

module.exports = validate(config);
