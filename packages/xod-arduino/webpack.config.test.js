const path = require('path');

/* eslint-disable import/no-extraneous-dependencies */
const validate = require('webpack-validator');
const merge = require('webpack-merge');
/* eslint-enable import/no-extraneous-dependencies */

const baseConfig = require('./webpack.config.js');

delete baseConfig.externals;

const pkgpath = subpath => path.resolve(__dirname, subpath);

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
        include: pkgpath('test/fixtures/'),
        test: /\.cpp$/,
        loader: 'raw',
      },
      {
        include: pkgpath('test/fixtures/'),
        test: /\.json/,
        loader: 'json',
      },
    ],
  },
});

module.exports = validate(config);
