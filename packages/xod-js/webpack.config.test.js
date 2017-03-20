
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
        include: /xod-project\/(test|src)/,
        test: /.*\.js$/,
        loaders: [
          'babel?presets[]=es2015',
        ],
      },
      {
        test: /.*\.spec\.js$/,
        loaders: [
          'babel?presets[]=es2015',
        ],
      },
      {
        include: pkgpath('test/fixtures/'),
        test: /\.txt$/,
        loader: 'raw',
      },
      {
        include: pkgpath('platform'),
        test: /\.js$/,
        loader: 'babel',
      },
    ],
  },
});

module.exports = validate(config);
